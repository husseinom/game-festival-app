import prisma from '../config/prisma.js';
import { ReservationStatus, InvoiceStatus, TableSize, GameSize } from '@prisma/client';

// Prix fixe d'une prise électrique (triplette) en euros HT
const ELECTRICAL_OUTLET_PRICE = 250;

// Constante de conversion : 1 unité de table = 4 m²
const M2_PER_TABLE_UNIT = 4;

// Équivalent en unités de table par taille de jeu
const GAME_SIZE_UNITS: Record<GameSize, number> = {
  SMALL: 0.5,    // Petit jeu = 0.5 unité = 2 m²
  STANDARD: 1,   // Jeu standard = 1 unité = 4 m²
  LARGE: 2       // Gros jeu = 2 unités = 8 m²
};

// Fonctions utilitaires de conversion
function tablesToM2(tableUnits: number): number {
  return tableUnits * M2_PER_TABLE_UNIT;
}

function m2ToTables(m2: number): number {
  return m2 / M2_PER_TABLE_UNIT;
}

function getGameUnits(gameSize: GameSize): number {
  return GAME_SIZE_UNITS[gameSize] ?? 1;
}

// Include standard pour les requêtes
const reservationInclude = {
  publisher: true,
  festival: true,
  reservant: true,
  zones: {
    include: {
      priceZone: true
    }
  },
  games: {
    include: {
      game: true,
      mapZone: true
    }
  },
  contactLogs: {
    orderBy: {
      contact_date: 'desc' as const
    }
  }
};

// ============================================
// CRUD de base
// ============================================

export const createReservation = async (data: any) => {
  const {
    game_publisher_id,
    festival_id,
    reservant_id,
    publisher_is_reservant,
    status,
    comments,
    large_table_request,
    is_publisher_presenting,
    needs_festival_animators,
    discount_amount,
    discount_tables,
    nb_electrical_outlets,
    tables
  } = data;

  // Vérifier que le festival existe et n'est pas terminé
  const festival = await prisma.festival.findUnique({
    where: { id: Number(festival_id) }
  });

  if (!festival) {
    throw new Error(`Le festival avec l'ID ${festival_id} n'existe pas.`);
  }

  const now = new Date();
  if (festival.endDate < now) {
    throw new Error(`Impossible de créer une réservation : le festival "${festival.name}" est terminé depuis le ${festival.endDate.toLocaleDateString('fr-FR')}.`);
  }

  const parsedGamePublisherId = game_publisher_id ? Number(game_publisher_id) : null;

  return prisma.$transaction(async (tx) => {
    // Si publisher_is_reservant est true, créer ou récupérer un réservant basé sur l'éditeur
    let finalReservantId = reservant_id ? Number(reservant_id) : null;
    
    if (publisher_is_reservant && parsedGamePublisherId) {
      const publisher = await tx.gamePublisher.findUnique({
        where: { id: parsedGamePublisherId }
      });
      
      if (!publisher) {
        throw new Error(`L'éditeur avec l'ID ${parsedGamePublisherId} n'existe pas.`);
      }
      
      let existingReservant = await tx.reservant.findFirst({
        where: {
          name: publisher.name,
          type: 'PUBLISHER'
        }
      });
      
      if (existingReservant) {
        finalReservantId = existingReservant.reservant_id;
      } else {
        const newReservant = await tx.reservant.create({
          data: {
            name: publisher.name,
            type: 'PUBLISHER',
          }
        });
        finalReservantId = newReservant.reservant_id;
      }
    }
    
    if (!finalReservantId) {
      throw new Error('Un réservant est requis pour créer une réservation.');
    }

    // Vérifier la disponibilité des tables dans chaque zone
    if (tables && Array.isArray(tables)) {
      for (const t of tables) {
        const zoneId = Number(t.price_zone_id);
        const requestedQty = Number(t.table_count || t.quantity);

        const priceZone = await tx.priceZone.findUnique({
          where: { id: zoneId },
          include: {
            tableTypes: true
          }
        });

        if (!priceZone) {
          throw new Error(`La zone de prix ID ${zoneId} n'existe pas.`);
        }

        // Calculate total capacity from PriceZone TableTypes
        let totalCapacity = 0;
        for (const tableType of priceZone.tableTypes) {
          totalCapacity += tableType.nb_total;
        }

        // Calculate currently reserved tables in this price zone
        const aggregation = await tx.zoneReservation.aggregate({
          _sum: { table_count: true },
          where: { price_zone_id: zoneId }
        });

        const currentReserved = aggregation._sum.table_count || 0;

        if (currentReserved + requestedQty > totalCapacity) {
          throw new Error(
            `Plus assez de tables disponibles dans la zone "${priceZone.name}". ` +
            `(Capacité: ${totalCapacity}, Réservées: ${currentReserved}, Demandées: ${requestedQty})`
          );
        }
      }
    }

    // Créer la réservation
    const reservation = await tx.reservation.create({
      data: {
        game_publisher_id: parsedGamePublisherId,
        festival_id: Number(festival_id),
        reservant_id: finalReservantId,
        status: status || 'NOT_CONTACTED',
        comments,
        large_table_request,
        is_publisher_presenting: Boolean(is_publisher_presenting),
        needs_festival_animators: Boolean(needs_festival_animators),
        discount_amount: discount_amount ? Number(discount_amount) : null,
        discount_tables: discount_tables ? Number(discount_tables) : null,
        nb_electrical_outlets: Number(nb_electrical_outlets) || 0,
        zones: {
          create: tables && Array.isArray(tables)
            ? tables.map((t: any) => {
                const tableCount = Number(t.table_count || t.quantity);
                return {
                  price_zone_id: Number(t.price_zone_id),
                  table_count: tableCount,
                  space_m2: tablesToM2(tableCount)
                };
              })
            : []
        }
      },
      include: reservationInclude
    });

    // Calculer et mettre à jour le montant final
    const finalAmount = await calculatePrice(reservation);
    return tx.reservation.update({
      where: { reservation_id: reservation.reservation_id },
      data: { final_invoice_amount: finalAmount },
      include: reservationInclude
    });
  });
};

export const getAllReservations = async () => {
  return prisma.reservation.findMany({
    include: reservationInclude,
    orderBy: { created_at: 'desc' }
  });
};

export const getReservationById = async (id: number) => {
  return prisma.reservation.findUnique({
    where: { reservation_id: id },
    include: reservationInclude
  });
};

export const getReservationsByFestival = async (festivalId: number) => {
  return prisma.reservation.findMany({
    where: { festival_id: festivalId },
    include: reservationInclude,
    orderBy: { created_at: 'desc' }
  });
};

export const updateReservation = async (id: number, data: any) => {
  const { tables, ...restData } = data;

  return prisma.$transaction(async (tx) => {
    // Mettre à jour la réservation
    const updated = await tx.reservation.update({
      where: { reservation_id: id },
      data: restData,
      include: reservationInclude
    });

    // Mettre à jour les zones si fournies
    if (tables && Array.isArray(tables) && tables.length > 0) {
      // Supprimer les anciennes zones
      await tx.zoneReservation.deleteMany({
        where: { reservation_id: id }
      });

      // Créer les nouvelles zones
      await tx.zoneReservation.createMany({
        data: tables.map((t: any) => {
          const tableCount = Number(t.table_count || t.quantity);
          return {
            reservation_id: id,
            price_zone_id: Number(t.price_zone_id),
            table_count: tableCount,
            space_m2: tablesToM2(tableCount)
          };
        })
      });
    }

    // Recalculer le montant final
    const reservationWithZones = await tx.reservation.findUnique({
      where: { reservation_id: id },
      include: reservationInclude
    });

    const finalAmount = await calculatePrice(reservationWithZones!);
    
    return tx.reservation.update({
      where: { reservation_id: id },
      data: { final_invoice_amount: finalAmount },
      include: reservationInclude
    });
  });
};

export const deleteReservation = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    // Récupérer tous les jeux placés de cette réservation
    const placedGames = await tx.festivalGame.findMany({
      where: { 
        reservation_id: id,
        map_zone_id: { not: null }
      },
      include: {
        mapZone: {
          include: { price_zone: true }
        }
      }
    });

    // Restaurer le stock de tables pour chaque jeu placé
    for (const game of placedGames) {
      if (game.map_zone_id && game.allocated_tables && game.mapZone?.price_zone) {
        const tableType = await tx.tableType.findFirst({
          where: {
            price_zone_id: game.mapZone.price_zone.id,
            name: game.table_size
          }
        });

        if (tableType) {
          await tx.tableType.update({
            where: { id: tableType.id },
            data: { nb_available: tableType.nb_available + game.allocated_tables }
          });
        }
      }
    }

    // Supprimer les données liées
    await tx.festivalGame.deleteMany({ where: { reservation_id: id } });
    await tx.contactLog.deleteMany({ where: { reservation_id: id } });
    await tx.zoneReservation.deleteMany({ where: { reservation_id: id } });
    return tx.reservation.delete({ where: { reservation_id: id } });
  });
};


// Workflow de suivi (statuts)


export const updateStatus = async (id: number, status: ReservationStatus) => {
  return prisma.reservation.update({
    where: { reservation_id: id },
    data: { status },
    include: reservationInclude
  });
};

export const updateStatusBatch = async (ids: number[], status: ReservationStatus) => {
  await prisma.reservation.updateMany({
    where: { reservation_id: { in: ids } },
    data: { status }
  });
  return prisma.reservation.findMany({
    where: { reservation_id: { in: ids } },
    include: reservationInclude
  });
};


// Facturation


export const markAsInvoiced = async (id: number) => {
  return prisma.reservation.update({
    where: { reservation_id: id },
    data: {
      invoice_status: 'INVOICED',
      invoiced_at: new Date()
    },
    include: reservationInclude
  });
};

export const markAsPaid = async (id: number) => {
  return prisma.reservation.update({
    where: { reservation_id: id },
    data: {
      invoice_status: 'PAID',
      paid_at: new Date()
    },
    include: reservationInclude
  });
};

export const updateInvoiceStatusBatch = async (ids: number[], invoiceStatus: InvoiceStatus) => {
  const updateData: any = { invoice_status: invoiceStatus };
  
  if (invoiceStatus === 'INVOICED') {
    updateData.invoiced_at = new Date();
  } else if (invoiceStatus === 'PAID') {
    updateData.paid_at = new Date();
  }

  await prisma.reservation.updateMany({
    where: { reservation_id: { in: ids } },
    data: updateData
  });

  return prisma.reservation.findMany({
    where: { reservation_id: { in: ids } },
    include: reservationInclude
  });
};

// export const applyPartnerDiscount = async (id: number) => {
//   const reservation = await prisma.reservation.findUnique({
//     where: { reservation_id: id },
//     include: { reservant: true, zones: { include: { priceZone: true } } }
//   });

//   if (!reservation) throw new Error('Réservation introuvable');

//   // Calculer le prix total avant remise
//   const totalBeforeDiscount = await calculatePrice(reservation, false);

//   // Appliquer une remise égale au total pour arriver à 0€
//   return prisma.reservation.update({
//     where: { reservation_id: id },
//     data: {
//       discount_amount: totalBeforeDiscount,
//       final_invoice_amount: 0
//     },
//     include: reservationInclude
//   });
// };

// Phase logistique - Liste des jeux


export const requestGameList = async (id: number) => {
  return prisma.reservation.update({
    where: { reservation_id: id },
    data: {
      game_list_requested: true,
      game_list_requested_at: new Date()
    },
    include: reservationInclude
  });
};

export const markGameListReceived = async (id: number) => {
  return prisma.reservation.update({
    where: { reservation_id: id },
    data: {
      game_list_received: true,
      game_list_received_at: new Date()
    },
    include: reservationInclude
  });
};

export const addGamesToReservation = async (
  reservationId: number,
  games: Array<{ game_id: number; copy_count: number; game_size?: GameSize; allocated_tables?: number }>
) => {
  // Créer les entrées FestivalGame avec calcul automatique des unités et m²
  await prisma.festivalGame.createMany({
    data: games.map(g => {
      const gameSize = (g.game_size as GameSize) || 'STANDARD';
      // Utiliser allocated_tables fourni ou calculer automatiquement
      const allocatedTables = g.allocated_tables ?? (getGameUnits(gameSize) * g.copy_count);
      return {
        reservation_id: reservationId,
        game_id: g.game_id,
        copy_count: g.copy_count,
        game_size: gameSize,
        allocated_tables: allocatedTables,
        space_m2: tablesToM2(allocatedTables)
      };
    })
  });

  return getReservationById(reservationId);
};

export const removeGameFromReservation = async (festivalGameId: number) => {
  // Récupérer le jeu pour avoir la reservation_id
  const festivalGame = await prisma.festivalGame.findUnique({
    where: { id: festivalGameId }
  });

  if (!festivalGame) {
    throw new Error('Jeu non trouvé dans la réservation');
  }

  // Supprimer le jeu de la réservation
  await prisma.festivalGame.delete({
    where: { id: festivalGameId }
  });

  // Retourner la réservation mise à jour
  return getReservationById(festivalGame.reservation_id);
};

export const markGamesReceived = async (id: number) => {
  return prisma.reservation.update({
    where: { reservation_id: id },
    data: {
      games_received: true,
      games_received_at: new Date()
    },
    include: reservationInclude
  });
};

export const markGameAsReceived = async (festivalGameId: number) => {
  return prisma.festivalGame.update({
    where: { id: festivalGameId },
    data: {
      is_received: true,
      received_at: new Date()
    },
    include: {
      game: true,
      mapZone: true
    }
  });
};


// Phase technique - Placement


export const placeGame = async (
  festivalGameId: number,
  mapZoneId: number,
  tableSize: TableSize,
  allocatedTables: number
) => {
  return prisma.$transaction(async (tx) => {
    // Récupérer la MapZone et sa PriceZone
    const mapZone = await tx.mapZone.findUnique({
      where: { id: mapZoneId },
      include: { price_zone: true }
    });

    if (!mapZone || !mapZone.price_zone) {
      throw new Error('Zone non trouvée ou sans zone tarifaire associée');
    }

    // Vérifier le stock disponible sur la PriceZone
    const tableType = await tx.tableType.findFirst({
      where: {
        price_zone_id: mapZone.price_zone.id,
        name: tableSize
      }
    });

    if (!tableType) {
      throw new Error(`Aucune table de type ${tableSize} dans cette zone tarifaire`);
    }

    if (tableType.nb_available < allocatedTables) {
      throw new Error(
        `Stock insuffisant. Disponible: ${tableType.nb_available}, Demandé: ${allocatedTables}`
      );
    }

    // Décrémenter le stock
    await tx.tableType.update({
      where: { id: tableType.id },
      data: { nb_available: tableType.nb_available - allocatedTables }
    });

    // Mettre à jour le jeu
    return tx.festivalGame.update({
      where: { id: festivalGameId },
      data: {
        map_zone_id: mapZoneId,
        table_size: tableSize,
        allocated_tables: allocatedTables,
        space_m2: tablesToM2(allocatedTables)
      },
      include: {
        game: true,
        mapZone: true
      }
    });
  });
};

export const unplaceGame = async (festivalGameId: number) => {
  return prisma.$transaction(async (tx) => {
    const game = await tx.festivalGame.findUnique({
      where: { id: festivalGameId },
      include: {
        mapZone: {
          include: { price_zone: true }
        }
      }
    });

    if (!game || !game.map_zone_id || !game.mapZone?.price_zone) {
      throw new Error('Ce jeu n\'est pas placé ou la zone est invalide');
    }

    // Rendre les tables au stock de la PriceZone
    const tableType = await tx.tableType.findFirst({
      where: {
        price_zone_id: game.mapZone.price_zone.id,
        name: game.table_size
      }
    });

    if (tableType) {
      await tx.tableType.update({
        where: { id: tableType.id },
        data: { nb_available: tableType.nb_available + game.allocated_tables }
      });
    }

    // Retirer le placement
    return tx.festivalGame.update({
      where: { id: festivalGameId },
      data: {
        map_zone_id: null,
        table_size: 'STANDARD',
        allocated_tables: 1
      },
      include: {
        game: true,
        mapZone: true
      }
    });
  });
};


// Historique des contacts

export const addContactLog = async (reservationId: number, notes: string) => {
  await prisma.contactLog.create({
    data: {
      reservation_id: reservationId,
      notes
    }
  });

  return getReservationById(reservationId);
};

export const getContactLogs = async (reservationId: number) => {
  return prisma.contactLog.findMany({
    where: { reservation_id: reservationId },
    orderBy: { contact_date: 'desc' }
  });
};


// Calcul du prix

const calculatePrice = async (reservation: any, applyDiscount = true): Promise<number> => {
  let total = 0;

  // Prix des tables par zone
  if (reservation.zones && Array.isArray(reservation.zones)) {
    for (const zone of reservation.zones) {
      const priceZone = zone.priceZone || await prisma.priceZone.findUnique({
        where: { id: zone.price_zone_id }
      });
      
      if (priceZone) {
        total += priceZone.table_price * zone.table_count;
      }
    }
  }

  // Prix des prises électriques
  total += (reservation.nb_electrical_outlets || 0) * ELECTRICAL_OUTLET_PRICE;

  if (applyDiscount) {
    // Remise en euros
    total -= reservation.discount_amount || 0;

    // Remise en tables (on enlève le prix des X premières tables)
    let remainingDiscount = reservation.discount_tables || 0;
    if (remainingDiscount > 0 && reservation.zones) {
      for (const zone of reservation.zones) {
        if (remainingDiscount <= 0) break;
        
        const priceZone = zone.priceZone || await prisma.priceZone.findUnique({
          where: { id: zone.price_zone_id }
        });
        
        if (priceZone) {
          const tablesToDiscount = Math.min(zone.table_count, remainingDiscount);
          total -= priceZone.table_price * tablesToDiscount;
          remainingDiscount -= tablesToDiscount;
        }
      }
    }
  }

  return Math.max(total, 0);
};

export const recalculatePrice = async (id: number) => {
  const reservation = await prisma.reservation.findUnique({
    where: { reservation_id: id },
    include: { zones: { include: { priceZone: true } } }
  });

  if (!reservation) throw new Error('Réservation introuvable');

  const finalAmount = await calculatePrice(reservation);
  
  return prisma.reservation.update({
    where: { reservation_id: id },
    data: { final_invoice_amount: finalAmount },
    include: reservationInclude
  });
};


// Statistiques par festival
export const getReservationStats = async (festivalId: number) => {
  const reservations = await prisma.reservation.findMany({
    where: { festival_id: festivalId },
    include: {
      zones: { include: { priceZone: true } },
      games: true
    }
  });

  const stats = {
    totalReservations: reservations.length,
    byStatus: {} as Record<string, number>,
    byInvoiceStatus: {} as Record<string, number>,
    totalTables: 0,
    totalElectricalOutlets: 0,
    totalGames: 0,
    totalRevenue: 0,
    paidRevenue: 0
  };

  for (const r of reservations) {
    // Comptage par statut
    stats.byStatus[r.status] = (stats.byStatus[r.status] || 0) + 1;
    stats.byInvoiceStatus[r.invoice_status] = (stats.byInvoiceStatus[r.invoice_status] || 0) + 1;

    // Totaux
    stats.totalTables += r.zones.reduce((sum, z) => sum + z.table_count, 0);
    stats.totalElectricalOutlets += r.nb_electrical_outlets;
    stats.totalGames += r.games.length;
    stats.totalRevenue += r.final_invoice_amount || 0;

    if (r.invoice_status === 'PAID') {
      stats.paidRevenue += r.final_invoice_amount || 0;
    }
  }

  return stats;
};

export default {
  createReservation,
  getAllReservations,
  getReservationById,
  getReservationsByFestival,
  updateReservation,
  deleteReservation,
  updateStatus,
  updateStatusBatch,
  markAsInvoiced,
  markAsPaid,
  updateInvoiceStatusBatch,
  requestGameList,
  markGameListReceived,
  addGamesToReservation,
  markGamesReceived,
  markGameAsReceived,
  placeGame,
  unplaceGame,
  addContactLog,
  getContactLogs,
  recalculatePrice,
  getReservationStats
};
