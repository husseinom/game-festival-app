import { PrismaClient, Role, ReservantType, TableSize, ReservationStatus, InvoiceStatus, GameSize } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding des données de test...');

  // --- 1. Nettoyage (Optionnel : commentez si vous voulez garder les anciennes données) ---
  console.log('🧹 Nettoyage des données existantes (hors Jeux/Éditeurs)...');
  await prisma.tableType.deleteMany(); // ✅ Added
  await prisma.zoneReservation.deleteMany();
  await prisma.contactLog.deleteMany();
  await prisma.festivalGame.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.mapZone.deleteMany();
  await prisma.priceZone.deleteMany();
  await prisma.festival.deleteMany();
  await prisma.reservant.deleteMany();
  await prisma.user.deleteMany();

  // --- 2. Création des Utilisateurs (Tous les rôles) ---
  console.log('👤 Création des utilisateurs...');
  const passwordHash = await bcrypt.hash('123456', 10);

  const users = [
    { name: 'Admin User', email: 'admin@fest.com', role: Role.ADMIN },
    { name: 'Justin Organisateur', email: 'justin@fest.com', role: Role.ORGANISATOR },
    { name: 'Super Orga', email: 'super@fest.com', role: Role.SUPER_ORGANISATOR },
    { name: 'Bénévole Bob', email: 'benevole@fest.com', role: Role.VOLUNTEER },
    { name: 'Visiteur Véro', email: 'visiteur@fest.com', role: Role.VISITOR },
  ];

  for (const u of users) {
    await prisma.user.create({
      data: { ...u, password: passwordHash }
    });
  }

  // --- 3. Création des Reservants ---
  console.log('📝 Création des réservants par typologie...');

  // 1. Éditeur (Le cas principal)
  const editeurAsmodee = await prisma.reservant.create({
    data: { 
      name: 'Asmodee', 
      type: 'Éditeur',
      email: 'contact@asmodee.com',
      mobile: '+33 6 12 34 56 78',
      role: 'Responsable Commercial'
    }
  });

  // 2. Autre éditeur
  const editeurDays = await prisma.reservant.create({
    data: { 
      name: 'Days of Wonder', 
      type: 'Éditeur',
      email: 'contact@daysofwonder.com',
      mobile: '+33 6 11 22 33 44',
      role: 'Directeur Commercial'
    }
  });

  // 3. Prestataire (représente plusieurs éditeurs)
  const prestataireAnim = await prisma.reservant.create({
    data: { 
      name: 'Ludis Animation', 
      type: 'Prestataire',
      email: 'info@ludis-animation.fr',
      mobile: '+33 6 23 45 67 89',
      role: 'Coordinateur Événementiel'
    }
  });

  // 4. Boutique (Facturation à zéro, commission externe)
  const boutiquePhilibert = await prisma.reservant.create({
    data: { 
      name: 'Philibert', 
      type: 'Boutique',
      email: 'pro@philibert.net',
      mobile: '+33 6 34 56 78 90',
      role: 'Responsable Partenariats'
    }
  });

  // 5. Association (Partenaire avec remise totale)
  const assoEchecs = await prisma.reservant.create({
    data: { 
      name: 'Club d\'Échecs Local', 
      type: 'Association',
      email: 'contact@echecs-local.org',
      mobile: '+33 6 45 67 89 01',
      role: 'Président'
    }
  });

  // 6. Animation / Zone Proto (Espace festival, pas de facturation)
  const zoneProto = await prisma.reservant.create({
    data: { 
      name: 'Zone Prototypes / Festival', 
      type: 'Animation / Zone Proto',
      email: 'proto@gamefest.com',
      mobile: '+33 6 56 78 90 12',
      role: 'Coordinateur Zone Proto'
    }
  });

  console.log('✅ Réservants créés avec succès.');

  // --- 4. Récupération des Types de Zones (PriceZoneType) ---
  // On suppose qu'ils sont déjà là via le script CSV, sinon on les crée
  const typeStandard = await prisma.priceZoneType.upsert({
    where: { key: 'standard' },
    update: {},
    create: { key: 'standard', name: 'Standard' }
  });
  
  const typeVIP = await prisma.priceZoneType.upsert({
    where: { key: 'vip' },
    update: {},
    create: { key: 'vip', name: 'VIP' }
  });

  const typeStandardVIP = await prisma.priceZoneType.upsert({
    where: { key: 'standard_vip' },
    update: {},
    create: { key: 'standard_vip', name: 'Standard + VIP' }
  });

  // --- 5. Création d'un Festival "Montpellier Game Fest 2025" ---
  console.log('🎪 Création du Festival...');
  const festival = await prisma.festival.create({
    data: {
      name: 'Montpellier Game Fest 2025',
      location: 'Parc des Expositions',
      startDate: new Date('2025-09-12'),
      endDate: new Date('2025-09-14'),
      priceZoneTypeId: typeStandardVIP.id // Type Standard + VIP
    }
  });

  // --- 6. Création des Zones Tarifaires (PriceZone) avec TableTypes ---
  // Les TableTypes sont maintenant liés directement aux PriceZones
  console.log('💰 Création des Zones Tarifaires avec Tables...');
  const zoneStandard = await prisma.priceZone.create({
    data: {
      festival_id: festival.id,
      name: 'Standard',
      table_price: 20.0,
      tableTypes: {
        create: [
          { 
            name: TableSize.STANDARD, 
            nb_total: 180, // 100 (Hall A) + 80 (Hall B)
            nb_available: 180, 
            nb_total_player: 4 
          },
          { 
            name: TableSize.LARGE, 
            nb_total: 20, 
            nb_available: 20, 
            nb_total_player: 6 
          },
          { 
            name: TableSize.CITY, 
            nb_total: 30, // 10 (Hall A) + 20 (Hall B)
            nb_available: 30, 
            nb_total_player: 8 
          }
        ]
      }
    }
  });

  const zoneVIP = await prisma.priceZone.create({
    data: {
      festival_id: festival.id,
      name: 'VIP',
      table_price: 60.0,
      tableTypes: {
        create: [
          { 
            name: TableSize.STANDARD, 
            nb_total: 50, 
            nb_available: 50, 
            nb_total_player: 5 
          },
          { 
            name: TableSize.LARGE, 
            nb_total: 15, 
            nb_available: 15, 
            nb_total_player: 6 
          }
        ]
      }
    }
  });

  // --- 7. Création des Zones Physiques (MapZone) - sans TableTypes ---
  // Les MapZones sont maintenant uniquement pour l'organisation physique
  console.log('🗺️  Création des Zones Physiques (MapZone)...');
  
  const mapZoneHallA = await prisma.mapZone.create({
    data: {
      festival_id: festival.id,
      price_zone_id: zoneStandard.id,
      name: 'Hall A - Allée Centrale'
    }
  });

  // Zone Physique 2 : Le Carré Or (Lié au tarif VIP)
  const mapZoneCarreOr = await prisma.mapZone.create({
    data: {
      festival_id: festival.id,
      price_zone_id: zoneVIP.id,
      name: 'Carré Or'
    }
  });

  const mapZoneHallB = await prisma.mapZone.create({
    data: {
      festival_id: festival.id,
      price_zone_id: zoneStandard.id,
      name: 'Hall B - Zone Famille'
    }
  });

  // --- 8. Simulation de Réservations ---
  console.log('🤝 Création de Réservations fictives...');

  // Récupérer quelques éditeurs existants (du CSV)
  const publishers = await prisma.gamePublisher.findMany({ take: 5 });

  if (publishers.length === 0) {
    console.warn('⚠️  Aucun éditeur trouvé en base. Avez-vous lancé import-csv.ts ? Pas de réservations créées.');
  } else {
    // 8a. Éditeur 1 : Réservation simple, en cours de discussion
    const reservation1 = await prisma.reservation.create({
      data: {
        game_publisher_id: publishers[0].id,
        festival_id: festival.id,
        reservant_id: assoEchecs.reservant_id,
        status: ReservationStatus.IN_DISCUSSION,
        is_publisher_presenting: true,
        nb_electrical_outlets: 2,
        comments: 'Intéressé par le carré VIP mais trouve ça cher.',
        zones: {
          create: [
            { 
              price_zone_id: zoneStandard.id, 
              table_count: 3,
              space_m2: 12 // 3 tables * 4 m²
            }
          ]
        },
        contactLogs: {
          create: { notes: 'Appel téléphonique le 20/09 : hésite encore.' }
        }
      }
    });

    // 8b. Éditeur 2 : Réservation confirmée avec tables + Ajout contact
    if (publishers.length > 1) {
      // 1. D'abord on ajoute le contact à l'éditeur (séparément)
      await prisma.contact.create({
        data: {
          game_publisher_id: publishers[1].id,
          name: 'Jean-Michel Contact', 
          email: 'jm@editeur.com', 
          tel: '0601020304'
        }
      });

      const reservation2 = await prisma.reservation.create({
        data: {
          game_publisher_id: publishers[1].id,
          festival_id: festival.id,
          reservant_id: editeurAsmodee.reservant_id,
          status: ReservationStatus.CONFIRMED,
          is_publisher_presenting: false,
          nb_electrical_outlets: 3,
          discount_amount: 50,
          final_invoice_amount: 450,
          game_list_requested: true,
          game_list_requested_at: new Date(),
          game_list_received: true,
          game_list_received_at: new Date(),
          zones: {
            create: [
              { 
                price_zone_id: zoneVIP.id, 
                table_count: 5,
                space_m2: 20 // 5 tables * 4 m²
              }
            ]
          }
        }
      });

      // Add games to reservation 2
      const games = await prisma.game.findMany({ 
        where: { publisherId: publishers[1].id },
        take: 5 
      });

      if (games.length > 0) {
        for (let i = 0; i < games.length; i++) {
          const game = games[i];
          const gameSize = i === 0 ? GameSize.LARGE : (i === 1 ? GameSize.SMALL : GameSize.STANDARD);
          const allocatedTables = gameSize === GameSize.LARGE ? 2 : (gameSize === GameSize.SMALL ? 0.5 : 1);
          
          await prisma.festivalGame.create({
            data: {
              reservation_id: reservation2.reservation_id,
              game_id: game.id,
              map_zone_id: mapZoneCarreOr.id,
              copy_count: 1,
              game_size: gameSize,
              table_size: gameSize === GameSize.LARGE ? TableSize.LARGE : TableSize.STANDARD,
              allocated_tables: allocatedTables,
              space_m2: allocatedTables * 4,
              is_received: i < 3, // First 3 games are received
              received_at: i < 3 ? new Date() : null
            }
          });

          // Update TableType availability
          if (i < games.length) {
            const tableType = await prisma.tableType.findFirst({
              where: {
                map_zone_id: mapZoneCarreOr.id,
                name: gameSize === GameSize.LARGE ? TableSize.LARGE : TableSize.STANDARD
              }
            });

            if (tableType) {
              await prisma.tableType.update({
                where: { id: tableType.id },
                data: { nb_available: tableType.nb_available - allocatedTables }
              });
            }
          }
        }
      }
    }

    // 8c. Réservation facturée
    if (publishers.length > 2) {
      const reservation3 = await prisma.reservation.create({
        data: {
          game_publisher_id: publishers[2].id,
          festival_id: festival.id,
          reservant_id: boutiquePhilibert.reservant_id,
          status: ReservationStatus.CONFIRMED,
          invoice_status: InvoiceStatus.INVOICED,
          is_publisher_presenting: true,
          nb_electrical_outlets: 5,
          invoiced_at: new Date(),
          final_invoice_amount: 500,
          zones: {
            create: [
              { 
                price_zone_id: zoneStandard.id, 
                table_count: 8,
                space_m2: 32 // 8 tables * 4 m²
              }
            ]
          }
        }
      });

      // Add games with placement
      const games = await prisma.game.findMany({ 
        where: { publisherId: publishers[2].id },
        take: 6 
      });

      if (games.length > 0) {
        for (let i = 0; i < games.length; i++) {
          const game = games[i];
          await prisma.festivalGame.create({
            data: {
              reservation_id: reservation3.reservation_id,
              game_id: game.id,
              map_zone_id: mapZoneHallA.id,
              copy_count: 1,
              game_size: GameSize.STANDARD,
              table_size: TableSize.STANDARD,
              allocated_tables: 1,
              space_m2: 4,
              is_received: true,
              received_at: new Date()
            }
          });

          // Update availability on PriceZone's TableType
          const tableType = await prisma.tableType.findFirst({
            where: {
              price_zone_id: zoneStandard.id,
              name: TableSize.STANDARD
            }
          });

          if (tableType) {
            await prisma.tableType.update({
              where: { id: tableType.id },
              data: { nb_available: tableType.nb_available - 1 }
            });
          }
        }
      }
    }

    // 8d. Prestataire reservation
    await prisma.reservation.create({
      data: {
        game_publisher_id: null,
        festival_id: festival.id,
        reservant_id: prestataireAnim.reservant_id,
        status: ReservationStatus.CONFIRMED,
        is_publisher_presenting: false,
        nb_electrical_outlets: 1,
        comments: 'Animation pour le compte de plusieurs éditeurs',
        zones: {
          create: [
            { 
              price_zone_id: zoneStandard.id, 
              table_count: 4,
              space_m2: 16
            }
          ]
        }
      }
    });
  }

  // Calculate and display total available tables
  const allTableTypes = await prisma.tableType.findMany({
    include: { priceZone: true }
  });

  const totalStandard = allTableTypes
    .filter(tt => tt.name === TableSize.STANDARD)
    .reduce((sum, tt) => sum + tt.nb_total, 0);
  
  const totalLarge = allTableTypes
    .filter(tt => tt.name === TableSize.LARGE)
    .reduce((sum, tt) => sum + tt.nb_total, 0);
  
  const totalCity = allTableTypes
    .filter(tt => tt.name === TableSize.CITY)
    .reduce((sum, tt) => sum + tt.nb_total, 0);

  console.log('✅ Seeding terminé avec succès !');
  console.log(`
  📊 Résumé:
  - ${users.length} utilisateurs créés
  - 6 réservants créés
  - 1 festival créé
  - 2 zones tarifaires créées (avec TableTypes)
  - 3 zones physiques (map zones) créées
  - Tables totales:
    * ${totalStandard} tables STANDARD (4m² chacune, 4 joueurs)
    * ${totalLarge} tables LARGE (8m² chacune, 6 joueurs)
    * ${totalCity} tables CITY (variable, 8 joueurs)
  - ${publishers.length > 0 ? '4' : '0'} réservations créées
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });