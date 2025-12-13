import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

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

async function importData() {
  try {
    console.log(' Début de l\'importation des données CSV...\n');

    // Vider les tables existantes (dans l'ordre inverse des dépendances)
    console.log(' Suppression des données existantes...');
    // Note: On ne supprime pas JeuMecanism car c'est une table de relation implicite gérée par Prisma
    // On supprime d'abord les jeux pour casser les liens
    await prisma.game.deleteMany(); 
    await prisma.gameMechanism.deleteMany();
    await prisma.gameType.deleteMany();
    await prisma.gamePublisher.deleteMany();
    console.log(' Tables vidées\n');

    // Importer les ÉDITEURS (GamePublisher)
    console.log('Importation des éditeurs...');
    const editeurs = readCSV('editeur.csv');
    
    for (const editeur of editeurs) {
      await prisma.gamePublisher.create({
        data: {
          id: parseInt(editeur.idEditeur),
          name: editeur.libelleEditeur,
          exposant: editeur.exposant === '1',
          distributeur: editeur.distributeur === '1',
          logoUrl: cleanValue(editeur.logoEditeur)
        }
      });
    }
    console.log(`${editeurs.length} éditeurs importés\n`);

    // Importer les TYPES DE JEU (GameType)
    console.log(' Importation des types de jeu...');
    const typesJeu = readCSV('typeJeu.csv');
    
    for (const type of typesJeu) {
      await prisma.gameType.create({
        data: {
          id: parseInt(type.idTypeJeu),
          label: type.libelleTypeJeu,
          // idZone ignoré car absent du nouveau schéma
        }
      });
    }
    console.log(`${typesJeu.length} types de jeu importés\n`);

    // Importer les MÉCANISMES (GameMechanism)
    console.log(' Importation des mécanismes...');
    const mecanismes = readCSV('mecanism.csv');
    
    for (const meca of mecanismes) {
      await prisma.gameMechanism.create({
        data: {
          id: parseInt(meca.idMecanism),
          label: meca.mecaName,
          description: cleanValue(meca.mecaDesc)
        }
      });
    }
    console.log(` ${mecanismes.length} mécanismes importés\n`);

    // Récupérer les IDs valides des éditeurs et types
    console.log(' Récupération des IDs valides...');
    const editeursValides = await prisma.gamePublisher.findMany({ select: { id: true } });
    const typesValides = await prisma.gameType.findMany({ select: { id: true } });
    
    const editeursIds = new Set(editeursValides.map(e => e.id));
    const typesIds = new Set(typesValides.map(t => t.id));
    
    console.log(` ${editeursIds.size} éditeurs valides, ${typesIds.size} types valides\n`);

    // Importer les JEUX (Game)
    console.log(' Importation des jeux...');
    const jeux = readCSV('jeu.csv');
    
    let jeuxImportes = 0;
    let jeuxIgnores = 0;
    
    for (const jeu of jeux) {
      try {
        const idEditeur = toInt(jeu.idEditeur);
        const idTypeJeu = toInt(jeu.idTypeJeu);
        
        // Vérifier que l'éditeur existe (si spécifié)
        if (idEditeur && !editeursIds.has(idEditeur)) {
          console.log(` Jeu "${jeu.libelleJeu}" ignoré : éditeur ${idEditeur} n'existe pas`);
          jeuxIgnores++;
          continue;
        }
        
        // Vérifier que le type existe (si spécifié)
        if (idTypeJeu && !typesIds.has(idTypeJeu)) {
          console.log(` Jeu "${jeu.libelleJeu}" ignoré : type ${idTypeJeu} n'existe pas`);
          jeuxIgnores++;
          continue;
        }
        
        await prisma.game.create({
          data: {
            id: parseInt(jeu.idJeu),
            name: jeu.libelleJeu,
            author: cleanValue(jeu.auteurJeu),
            minPlayers: toInt(jeu.nbMinJoueurJeu),
            maxPlayers: toInt(jeu.nbMaxJoueurJeu),
            noticeUrl: cleanValue(jeu.noticeJeu),
            publisherId: idEditeur,
            typeId: idTypeJeu,
            minAge: toInt(jeu.agemini),
            prototype: jeu.prototype === '1',
            duration: toInt(jeu.duree),
            theme: cleanValue(jeu.theme),
            description: cleanValue(jeu.description),
            imageUrl: cleanValue(jeu.imageJeu),
            videoUrl: cleanValue(jeu.videoRegle)
          }
        });
        
        jeuxImportes++;
        
        // Afficher la progression tous les 100 jeux
        if (jeuxImportes % 100 === 0) {
          console.log(` ${jeuxImportes} jeux importés...`);
        }
      } catch (error: any) {
        console.log(` Erreur sur jeu "${jeu.libelleJeu}": ${error.message}`);
        jeuxIgnores++;
      }
    }
    
    console.log(` ${jeuxImportes} jeux importés, ${jeuxIgnores} ignorés\n`);

    // Récupérer les IDs valides des jeux et mécanismes
    console.log(' Récupération des IDs valides pour les relations...');
    const jeuxValides = await prisma.game.findMany({ select: { id: true } });
    const mecanismesValides = await prisma.gameMechanism.findMany({ select: { id: true } });
    
    const jeuxIds = new Set(jeuxValides.map(j => j.id));
    const mecanismesIds = new Set(mecanismesValides.map(m => m.id));
    
    console.log(`${jeuxIds.size} jeux valides, ${mecanismesIds.size} mécanismes valides\n`);

    // Importer les RELATIONS JEU-MÉCANISME
    console.log(' Importation des relations jeu-mécanisme...');
    const jeuMecanismes = readCSV('jeu_mecanism.csv');
    
    let relationsImportees = 0;
    let relationsIgnorees = 0;
    
    for (const relation of jeuMecanismes) {
      try {
        const idJeu = toInt(relation.idJeu);
        const idMecanism = toInt(relation.idMecanism);
        
        // Vérifier que le jeu et le mécanisme existent
        if (!idJeu || !jeuxIds.has(idJeu)) {
          relationsIgnorees++;
          continue;
        }
        
        if (!idMecanism || !mecanismesIds.has(idMecanism)) {
          relationsIgnorees++;
          continue;
        }
        
        // Mise à jour du jeu pour ajouter le mécanisme (relation Many-to-Many)
        await prisma.game.update({
          where: { id: idJeu },
          data: {
            mechanisms: {
              connect: { id: idMecanism }
            }
          }
        });
        
        relationsImportees++;
        
        // Afficher la progression tous les 100 relations
        if (relationsImportees % 100 === 0) {
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