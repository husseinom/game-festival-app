import prisma from '../config/prisma.js';

export const createReservation = async (data: any) => {
  const final_invoice_amount = await calculateFinalInvoiceAmount(data);

  const {
    game_publisher_id,
    festival_id,
    reservant_id,
    status,
    comments,
    is_publisher_presenting,
    game_list_requested,
    game_list_received,
    games_received,
    discount_amount,
    discount_tables,
    nb_electrical_outlets,
    tables
  } = data;

  return prisma.$transaction(async (tx) => {
    if (tables && Array.isArray(tables)) {
      for (const t of tables) {
        const zoneId = Number(t.price_zone_id);
        const requestedQty = Number(t.table_count || t.quantity);

        const priceZone = await tx.priceZone.findUnique({
          where: { id: zoneId },
          select: { total_tables: true, name: true }
        });

        if (!priceZone) {
          throw new Error(`La zone de prix ID ${zoneId} n'existe pas.`);
        }

        if (priceZone.total_tables !== null) {
          const aggregation = await tx.zoneReservation.aggregate({
            _sum: {
              table_count: true
            },
            where: {
              price_zone_id: zoneId
            }
          });

          const currentReserved = aggregation._sum.table_count || 0;

          // C. Vérification finale
          if (currentReserved + requestedQty > priceZone.total_tables) {
            throw new Error(
              `Plus assez de tables disponibles dans la zone "${priceZone.name}". ` +
              `(Capacité: ${priceZone.total_tables}, Réservées: ${currentReserved}, Demandées: ${requestedQty})`
            );
          }
        }
      }
    }

    // ÉTAPE 2 : Si tout est bon, on crée la réservation
    const reservation = await tx.reservation.create({
      data: {
        game_publisher_id: Number(game_publisher_id),
        festival_id: Number(festival_id),
        reservant_id: Number(reservant_id),
        status: status || 'Contact pris',
        comments,
        is_publisher_presenting: Boolean(is_publisher_presenting),
        game_list_requested: Boolean(game_list_requested),
        game_list_received: Boolean(game_list_received),
        games_received: Boolean(games_received),
        discount_amount,
        discount_tables,
        nb_electrical_outlets: Number(nb_electrical_outlets) || 0,
        final_invoice_amount,

        zones: {
          create: tables && Array.isArray(tables) 
            ? tables.map((t: any) => ({
                price_zone_id: Number(t.price_zone_id),
                table_count: Number(t.table_count || t.quantity)
              })) 
            : []
        }
      },
      include: {
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
        contactLogs: true
      }
    });

    return reservation;
  });
};

export const getAllReservations = async () => {
  return prisma.reservation.findMany({
    include: {
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
      contactLogs: true
    },
  });
};

export const getReservationById = async (id: number) => {
  return prisma.reservation.findUnique({
    where: { reservation_id: id },
    include: { 
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
      contactLogs: true
    },
  });
};

export const updateReservation = async (id: number, data: any) => {
  // On sépare les tables du reste pour éviter les erreurs lors de l'update simple
  const { tables, ...restData } = data;

  // Mise à jour des infos principales
  return prisma.reservation.update({
    where: { reservation_id: id },
    data: restData,
    include: { 
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
      contactLogs: true
    }
  });
};

export const deleteReservation = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    // Delete all related records in order of dependencies
    await tx.festivalGame.deleteMany({
      where: { reservation_id: id }
    });

    await tx.contactLog.deleteMany({
      where: { reservation_id: id }
    });

    await tx.zoneReservation.deleteMany({
      where: { reservation_id: id }
    });

    // Finally delete the reservation
    return tx.reservation.delete({
      where: { reservation_id: id }
    });
  });
};

export default {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
};

const calculateFinalInvoiceAmount = async (data: any): Promise<number> => {
  const {
    tables,
    discount_amount = 0,
    discount_tables = 0,
    nb_electrical_outlets = 0
  } = data;

  let total = 0;
  let remainingDiscount = discount_tables;

  if (tables && Array.isArray(tables)) {
    for (const t of tables) {
      const zone = await prisma.priceZone.findUnique({
        where: { id: Number(t.price_zone_id) }
      });

      if (zone) {
        const tableCount = Number(t.table_count || t.quantity);
        total += zone.table_price * tableCount;
      }
    }
  }

  total -= discount_amount;

  if (remainingDiscount > 0 && tables && Array.isArray(tables)) {
    for (const t of tables) {
      if (remainingDiscount <= 0) break;

      const zone = await prisma.priceZone.findUnique({
        where: { id: Number(t.price_zone_id) }
      });

      if (zone) {
        const tableCount = Math.min(Number(t.table_count || t.quantity), remainingDiscount);
        total -= zone.table_price * tableCount;
        remainingDiscount -= tableCount;
      }
    }
  }

  total += Number(nb_electrical_outlets) * 250;

  return total >= 0 ? total : 0;
};