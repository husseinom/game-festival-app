import type { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getByFestival = async (req: Request, res: Response) => {
  try {
    const festivalId = Number(req.params.festivalId);
    if (Number.isNaN(festivalId)) {
      return res.status(400).json({ error: 'Invalid festivalId' });
    }
    const mapZones = await prisma.mapZone.findMany({
      where: { festival_id: festivalId },
      include: {
        price_zone: {
          include: { tableTypes: true }
        },
        festivalGames: {
          include: {
            game: true,
            reservation: {
              include: {
                publisher: true
              }
            }
          }
        }
      }
    });
    res.json(mapZones);
  } catch (error) {
    console.error('Error fetching map zones by festival:', error);
    res.status(500).json({ message: 'Error fetching map zones' });
  }
};

export const getByPriceZone = async (req: Request, res: Response) => {
  try {
    const priceZoneId = Number(req.params.priceZoneId);
    if (Number.isNaN(priceZoneId)) {
      return res.status(400).json({ error: 'Invalid priceZoneId' });
    }
    const mapZones = await prisma.mapZone.findMany({
      where: { price_zone_id: priceZoneId },
      include: {
        price_zone: {
          include: { tableTypes: true }
        },
        festivalGames: {
          include: {
            game: true,
            reservation: {
              include: {
                publisher: true
              }
            }
          }
        }
      }
    });
    res.json(mapZones);
  } catch (error) {
    console.error('Error fetching map zones:', error);
    res.status(500).json({ message: 'Error fetching map zones' });
  }
};

export const create = async (req: Request, res: Response) => {
  const { festival_id, price_zone_id, name, small_tables, large_tables, city_tables } = req.body;

  try {
    const mapZone = await prisma.mapZone.create({
      data: { 
        festival_id, 
        price_zone_id, 
        name,
        small_tables: small_tables || 0,
        large_tables: large_tables || 0,
        city_tables: city_tables || 0
      },
      include: {
        price_zone: {
          include: { tableTypes: true }
        },
        festivalGames: true
      }
    });

    res.status(201).json(mapZone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addFestivalGame = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { festivalGameId } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid map zone id' });
    }

    const festivalGame = await prisma.festivalGame.update({
      where: { id: festivalGameId },
      data: { map_zone_id: id },
      include: {
        game: true,
        reservation: {
          include: {
            publisher: true
          }
        }
      }
    });
    res.json(festivalGame);
  } catch (error) {
    console.error('Error adding festival game:', error);
    res.status(500).json({ message: 'Error adding festival game' });
  }
};

export const removeFestivalGame = async (req: Request, res: Response) => {
  try {
    const festivalGameId = Number(req.params.festivalGameId);

    if (Number.isNaN(festivalGameId)) {
      return res.status(400).json({ error: 'Invalid festival game id' });
    }

    const festivalGame = await prisma.festivalGame.update({
      where: { id: festivalGameId },
      data: { map_zone_id: null }
    });
    res.json(festivalGame);
  } catch (error) {
    console.error('Error removing festival game:', error);
    res.status(500).json({ message: 'Error removing festival game' });
  }
};

export const deleteMapZone = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid map zone id' });
    }

    // Vérifier s'il y a des jeux associés à cette zone
    const gamesInZone = await prisma.festivalGame.count({
      where: { map_zone_id: id }
    });

    if (gamesInZone > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer cette zone : ${gamesInZone} jeu(x) sont encore placés dans cette zone. Retirez-les d'abord.`
      });
    }

    // Supprimer la zone (TableTypes sont maintenant sur PriceZone, pas sur MapZone)
    await prisma.mapZone.delete({ where: { id: id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting map zone:', error);
    res.status(500).json({ message: 'Error deleting map zone' });
  }
};