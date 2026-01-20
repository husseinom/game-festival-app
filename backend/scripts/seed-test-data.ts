import { PrismaClient, Role, ReservantType, TableSize, ReservationStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding des données de test...');

  // --- 1. Nettoyage (Optionnel : commentez si vous voulez garder les anciennes données) ---
  // On supprime d'abord les enfants pour éviter les contraintes de clés étrangères
  console.log('🧹 Nettoyage des données existantes (hors Jeux/Éditeurs)...');
  await prisma.zoneReservation.deleteMany();
  await prisma.contactLog.deleteMany();
  await prisma.festivalGame.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.tableType.deleteMany();
  await prisma.mapZone.deleteMany();
  await prisma.priceZone.deleteMany();
  await prisma.festival.deleteMany();
  await prisma.reservant.deleteMany();
  await prisma.user.deleteMany();
  // On ne touche PAS à Game, GamePublisher, GameType, GameMechanism

  // --- 2. Création des Utilisateurs (Tous les rôles) ---
  console.log('👤 Création des utilisateurs...');
  const passwordHash = await bcrypt.hash('123456', 10); // Mot de passe pour tous : 123456

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

// --- 3. Création des Reservants (selon la nouvelle typologie) ---
  console.log('📝 Création des réservants par typologie...');

  // 1. Éditeur (Le cas principal)
  const editeurAsmodee = await prisma.reservant.create({
    data: { name: 'Asmodee', type: ReservantType.PUBLISHER }
  });

  // 2. Autre éditeur
  const editeurDays = await prisma.reservant.create({
    data: { name: 'Days of Wonder', type: ReservantType.PUBLISHER }
  });

  // 3. Prestataire (représente plusieurs éditeurs)
  const prestataireAnim = await prisma.reservant.create({
    data: { name: 'Ludis Animation', type: ReservantType.PROVIDER }
  });

  // 4. Boutique (Facturation à zéro, commission externe)
  const boutiquePhilibert = await prisma.reservant.create({
    data: { name: 'Philibert', type: ReservantType.SHOP, is_partner: true }
  });

  // 5. Association (Partenaire avec remise totale)
  const assoEchecs = await prisma.reservant.create({
    data: { name: 'Club Echecs Local', type: ReservantType.ASSOCIATION, is_partner: true }
  });

  // 6. Animation / Zone Proto (Espace festival, pas de facturation)
  const zoneProto = await prisma.reservant.create({
    data: { name: 'Zone Prototypes / Festival', type: ReservantType.ANIMATION, is_partner: true }
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

  // --- 5. Création d'un Festival "Montpellier Game Fest 2025" ---
  console.log('🎪 Création du Festival...');
  const festival = await prisma.festival.create({
    data: {
      name: 'Montpellier Game Fest 2025',
      location: 'Parc des Expositions',
      total_tables: 200,
      startDate: new Date('2025-09-12'),
      endDate: new Date('2025-09-14'),
      priceZoneTypeId: typeStandard.id // Type par défaut
    }
  });

  // --- 6. Création des Zones Tarifaires (PriceZone) ---
  console.log('💰 Création des Zones Tarifaires...');
  const zoneStandard = await prisma.priceZone.create({
    data: {
      festival_id: festival.id,
      name: 'Zone Standard (Grand Hall)',
      table_price: 100.0,
      total_tables: 150
    }
  });

  const zoneVIP = await prisma.priceZone.create({
    data: {
      festival_id: festival.id,
      name: 'Zone VIP (Entrée)',
      table_price: 250.0,
      total_tables: 50
    }
  });

  // --- 7. Création des Zones du Plan (MapZone) et Types de Tables ---
  console.log('🗺️  Création des Zones Physiques (MapZone)...');
  
  // Zone Physique 1 : Le Hall Principal (Lié au tarif Standard)
  const mapZoneHallA = await prisma.mapZone.create({
    data: {
      festival_id: festival.id,
      price_zone_id: zoneStandard.id,
      name: 'Hall A - Allée Centrale',
      tableTypes: {
        create: [
          { name: TableSize.STANDARD, nb_total: 100, nb_available: 100, nb_total_player: 4 },
          { name: TableSize.LARGE, nb_total: 20, nb_available: 20, nb_total_player: 6 }
        ]
      }
    }
  });

  // Zone Physique 2 : Le Carré Or (Lié au tarif VIP)
  const mapZoneCarreOr = await prisma.mapZone.create({
    data: {
      festival_id: festival.id,
      price_zone_id: zoneVIP.id,
      name: 'Carré Or',
      tableTypes: {
        create: [
          { name: TableSize.STANDARD, nb_total: 50, nb_available: 50, nb_total_player: 5 }
        ]
      }
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
    await prisma.reservation.create({
      data: {
        game_publisher_id: publishers[0].id,
        festival_id: festival.id,
        reservant_id: assoEchecs.reservant_id,
        status: ReservationStatus.IN_DISCUSSION,
        is_publisher_presenting: true,
        nb_electrical_outlets: 2,
        comments: 'Intéressé par le carré VIP mais trouve ça cher.',
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

      // 2. Ensuite on crée la réservation
      await prisma.reservation.create({
        data: {
          game_publisher_id: publishers[1].id,
          festival_id: festival.id,
          reservant_id: editeurAsmodee.reservant_id,
          status: ReservationStatus.CONFIRMED,
          is_publisher_presenting: false,
          nb_electrical_outlets: 3,
          discount_amount: 50,
          final_invoice_amount: 450,
          zones: {
            create: [
              { price_zone_id: zoneVIP.id, table_count: 2 }
            ]
          }
        }
      });
    }

    // 8c. Éditeur 3 : Réservation Facturée
    if (publishers.length > 2) {
      await prisma.reservation.create({
        data: {
          game_publisher_id: publishers[2].id,
          festival_id: festival.id,
          reservant_id: boutiquePhilibert.reservant_id,
          status: ReservationStatus.CONFIRMED,
          invoice_status: InvoiceStatus.INVOICED,
          is_publisher_presenting: true,
          nb_electrical_outlets: 5,
          zones: {
            create: [
              { price_zone_id: zoneStandard.id, table_count: 5 } // 5 tables standard
            ]
          }
        }
      });
    }
  }

  console.log('✅ Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });