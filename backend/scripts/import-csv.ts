import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour lire et parser un fichier CSV
function readCSV(filename: string): any[] {
  const filePath = path.join(__dirname, '..', 'data', filename);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ',',
    quote: '"',
    relax_quotes: true,
    relax_column_count: true
  });
}

// Nettoyer les valeurs
function cleanValue(value: any): any {
  if (value === '' || value === 'NULL' || value === null) return null;
  return value;
}

// Convertir en nombre ou null
function toInt(value: any): number | null {
  if (!value || value === '' || value === 'NULL') return null;
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

async function seedPriceZoneTypes() {
  await prisma.priceZoneType.createMany({
    data: [
      { key: 'standard', name: 'standard' },
      { key: 'vip', name: 'vip' },
      { key: 'standard_vip', name: 'standard_vip' },
    ],
    skipDuplicates: true, // safe to run multiple times
  });
  console.log(' Seeded PriceZoneType rows');
}

async function importData() {
  try {
    console.log(' Début de l\'importation des données CSV...\n');

    // Seed small static tables unconditionally (idempotent)
    await seedPriceZoneTypes();

    // --- Helper to bulk create when table empty, otherwise upsert per row ---
    async function createManyIfEmpty<T>(
      countFn: () => Promise<number>,
      createManyFn: (data: T[]) => Promise<any>,
      data: T[]
    ) {
      const cnt = await countFn();
      if (cnt === 0) {
        await createManyFn(data);
        return true; // bulk created
      }
      return false; // already had data
    }

    // --- GamePublishers (éditeurs) ---
    console.log('Importation des éditeurs...');
    const editeurs = readCSV('editeur.csv').map(ed => ({
      id: parseInt(ed.idEditeur),
      name: ed.libelleEditeur,
      exposant: ed.exposant === '1',
      distributeur: ed.distributeur === '1',
      logoUrl: cleanValue(ed.logoEditeur)
    }));

    const createdPublishers = await createManyIfEmpty(
      () => prisma.gamePublisher.count(),
      (data) => prisma.gamePublisher.createMany({ data, skipDuplicates: true }),
      editeurs
    );

    if (!createdPublishers) {
      // upsert each publisher to avoid duplicates, keep existing ids if present
      for (const p of editeurs) {
        try {
          await prisma.gamePublisher.upsert({
            where: { id: p.id },
            create: p,
            update: {
              name: p.name,
              exposant: p.exposant,
              distributeur: p.distributeur,
              logoUrl: p.logoUrl
            }
          });
        } catch (err: any) {
          console.log(`  Éditeur upsert ignored for id=${p.id}: ${err.message}`);
        }
      }
    }
    console.log(`${editeurs.length} éditeurs traités\n`);

    // --- GameTypes ---
    console.log('Importation des types de jeu...');
    const typesJeu = readCSV('typeJeu.csv').map(t => ({
      id: parseInt(t.idTypeJeu),
      label: t.libelleTypeJeu
    }));

    const createdTypes = await createManyIfEmpty(
      () => prisma.gameType.count(),
      (data) => prisma.gameType.createMany({ data, skipDuplicates: true }),
      typesJeu
    );

    if (!createdTypes) {
      for (const tt of typesJeu) {
        try {
          await prisma.gameType.upsert({
            where: { id: tt.id },
            create: tt,
            update: { label: tt.label }
          });
        } catch (err: any) {
          console.log(`  Type upsert ignored for id=${tt.id}: ${err.message}`);
        }
      }
    }
    console.log(`${typesJeu.length} types de jeu traités\n`);

    // --- GameMechanisms ---
    console.log('Importation des mécanismes...');
    const mecanismes = readCSV('mecanism.csv').map(m => ({
      id: parseInt(m.idMecanism),
      label: m.mecaName,
      description: cleanValue(m.mecaDesc)
    }));

    const createdMecas = await createManyIfEmpty(
      () => prisma.gameMechanism.count(),
      (data) => prisma.gameMechanism.createMany({ data, skipDuplicates: true }),
      mecanismes
    );

    if (!createdMecas) {
      for (const mm of mecanismes) {
        try {
          await prisma.gameMechanism.upsert({
            where: { id: mm.id },
            create: mm,
            update: { label: mm.label, description: mm.description }
          });
        } catch (err: any) {
          console.log(`  Mécanisme upsert ignored for id=${mm.id}: ${err.message}`);
        }
      }
    }
    console.log(`${mecanismes.length} mécanismes traités\n`);

    // --- Jeux (Game) ---
    console.log(' Importation des jeux...');

    // 1. Récupérer les IDs existants pour validation (clés étrangères)
    const existingPublishers = await prisma.gamePublisher.findMany({ select: { id: true } });
    const validPublisherIds = new Set(existingPublishers.map(p => p.id));

    const existingTypes = await prisma.gameType.findMany({ select: { id: true } });
    const validTypeIds = new Set(existingTypes.map(t => t.id));

    // 2. Mapper les jeux en vérifiant les clés étrangères
    const jeux = readCSV('jeu.csv').map(j => {
      const rawPubId = toInt(j.idEditeur);
      const rawTypeId = toInt(j.idTypeJeu);

      // Vérification Editeur
      let finalPubId = rawPubId;
      if (rawPubId && !validPublisherIds.has(rawPubId)) {
        console.warn(`  ⚠️  Attention : Jeu "${j.libelleJeu}" référence l'éditeur ${rawPubId} introuvable. Mis à NULL.`);
        finalPubId = null;
      }

      // Vérification Type
      let finalTypeId = rawTypeId;
      if (rawTypeId && !validTypeIds.has(rawTypeId)) {
        console.warn(`  ⚠️  Attention : Jeu "${j.libelleJeu}" référence le type ${rawTypeId} introuvable. Mis à NULL.`);
        finalTypeId = null;
      }

      return {
        id: parseInt(j.idJeu),
        name: j.libelleJeu,
        author: cleanValue(j.auteurJeu),
        minPlayers: toInt(j.nbMinJoueurJeu),
        maxPlayers: toInt(j.nbMaxJoueurJeu),
        noticeUrl: cleanValue(j.noticeJeu),
        publisherId: finalPubId, // ID validé ou null
        typeId: finalTypeId,     // ID validé ou null
        minAge: toInt(j.agemini),
        prototype: j.prototype === '1',
        duration: toInt(j.duree),
        theme: cleanValue(j.theme),
        description: cleanValue(j.description),
        imageUrl: cleanValue(j.imageJeu),
        videoUrl: cleanValue(j.videoRegle)
      };
    });

    const createdGamesBulk = await createManyIfEmpty(
      () => prisma.game.count(),
      (data) => prisma.game.createMany({ data, skipDuplicates: true }),
      jeux
    );

    if (!createdGamesBulk) {
      let jeuxImportes = 0;
      let jeuxIgnores = 0;
      for (const jeu of jeux) {
        try {
          await prisma.game.upsert({
            where: { id: jeu.id },
            create: jeu,
            update: {
              name: jeu.name,
              author: jeu.author,
              minPlayers: jeu.minPlayers,
              maxPlayers: jeu.maxPlayers,
              noticeUrl: jeu.noticeUrl,
              publisherId: jeu.publisherId,
              typeId: jeu.typeId,
              minAge: jeu.minAge,
              prototype: jeu.prototype,
              duration: jeu.duration,
              theme: jeu.theme,
              description: jeu.description,
              imageUrl: jeu.imageUrl,
              videoUrl: jeu.videoUrl
            }
          });
          jeuxImportes++;
          if (jeuxImportes % 100 === 0) console.log(` ${jeuxImportes} jeux upsertés...`);
        } catch (error: any) {
          console.log(` Erreur sur jeu "${jeu.name}": ${error.message}`);
          jeuxIgnores++;
        }
      }
      console.log(` ${jeuxImportes} jeux upsertés, ${jeuxIgnores} ignorés\n`);
    } else {
      console.log(`${jeux.length} jeux créés en bulk\n`);
    }

    // --- Relations Jeu-Mécanisme ---
    console.log(' Importation des relations jeu-mécanisme...');
    const jeuMecanismes = readCSV('jeu_mecanism.csv');

    // fetch valid ids to avoid errors
    const jeuxValides = await prisma.game.findMany({ select: { id: true } });
    const mecanismesValides = await prisma.gameMechanism.findMany({ select: { id: true } });
    const jeuxIds = new Set(jeuxValides.map(j => j.id));
    const mecanismesIds = new Set(mecanismesValides.map(m => m.id));

    let relationsImportees = 0;
    let relationsIgnorees = 0;

    for (const relation of jeuMecanismes) {
      try {
        const idJeu = toInt(relation.idJeu);
        const idMecanism = toInt(relation.idMecanism);

        if (!idJeu || !jeuxIds.has(idJeu)) { relationsIgnorees++; continue; }
        if (!idMecanism || !mecanismesIds.has(idMecanism)) { relationsIgnorees++; continue; }

        // use a guarded update connect; ignore unique-constraint errors when already connected
        try {
          await prisma.game.update({
            where: { id: idJeu },
            data: {
              mechanisms: { connect: { id: idMecanism } }
            }
          });
          relationsImportees++;
        } catch (innerErr: any) {
          // already connected or other issue — ignore duplicate relation errors
          relationsIgnorees++;
        }

        if (relationsImportees % 100 === 0 && relationsImportees > 0) {
          console.log(` ${relationsImportees} relations importées...`);
        }
      } catch (error: any) {
        console.log(` Erreur sur relation: ${error.message}`);
        relationsIgnorees++;
      }
    }

    console.log(` ${relationsImportees} relations importées, ${relationsIgnorees} ignorées\n`);
    console.log(' Importation terminée avec succès !');

  } catch (error) {
    console.error(' Erreur lors de l\'importation :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData();