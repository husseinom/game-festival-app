import type { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getByPriceZone = async (req: Request, res: Response) => {
  try {
    const priceZoneId = Number(req.params.priceZoneId);
    if (Number.isNaN(priceZoneId)) {
      return res.status(400).json({ error: 'Invalid priceZoneId' });
    }
    const mapZones = await prisma.mapZone.findMany({
      where: { price_zone_id: priceZoneId },
      include: { 
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
  try {
    const { name, price_zone_id, small_tables, large_tables, city_tables, gameIds } = req.body;
    
    if (!name || !price_zone_id) {
      return res.status(400).json({ error: 'Name and price_zone_id are required' });
    }

    // Get the price zone to check available tables and get festival_id
    const priceZone = await prisma.priceZone.findUnique({
      where: { id: price_zone_id },
      include: {
        mapZones: true
      }
    });

    if (!priceZone) {
      return res.status(404).json({ error: 'Price zone not found' });
    }

    // Calculate already allocated tables
    const allocatedTables = priceZone.mapZones.reduce((acc, zone) => ({
      small: acc.small + zone.small_tables,
      large: acc.large + zone.large_tables,
      city: acc.city + zone.city_tables
    }), { small: 0, large: 0, city: 0 });

    // Calculate available tables
    const availableTables = {
      small: priceZone.small_tables - allocatedTables.small,
      large: priceZone.large_tables - allocatedTables.large,
      city: priceZone.city_tables - allocatedTables.city
    };

    // Validate requested tables
    const requestedSmall = small_tables || 0;
    const requestedLarge = large_tables || 0;
    const requestedCity = city_tables || 0;

    if (requestedSmall > availableTables.small) {
      return res.status(400).json({ 
        error: `Not enough small tables available. Requested: ${requestedSmall}, Available: ${availableTables.small}` 
      });
    }
    if (requestedLarge > availableTables.large) {
      return res.status(400).json({ 
        error: `Not enough large tables available. Requested: ${requestedLarge}, Available: ${availableTables.large}` 
      });
    }
    if (requestedCity > availableTables.city) {
      return res.status(400).json({ 
        error: `Not enough city tables available. Requested: ${requestedCity}, Available: ${availableTables.city}` 
      });
    }

    // Create map zone with festival_id
    const mapZone = await prisma.mapZone.create({
      data: { 
        name, 
        price_zone_id,
        festival_id: priceZone.festival_id, // Add this line
        small_tables: requestedSmall,
        large_tables: requestedLarge,
        city_tables: requestedCity
      }
    });

    // Assign games to this map zone
    if (gameIds && gameIds.length > 0) {
      await prisma.festivalGame.updateMany({
        where: { 
          id: { in: gameIds },
          map_zone_id: null
        },
        data: { map_zone_id: mapZone.id }
      });
    }

    const mapZoneWithGames = await prisma.mapZone.findUnique({
      where: { id: mapZone.id },
      include: {
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

    res.status(201).json(mapZoneWithGames);
  } catch (error) {
    console.error('Error creating map zone:', error);
    res.status(500).json({ message: 'Error creating map zone' });
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
    
    // Unassign all games from this map zone before deleting
    await prisma.festivalGame.updateMany({
      where: { map_zone_id: id },
      data: { map_zone_id: null }
    });
    
    // Delete the map zone
    await prisma.mapZone.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting map zone:', error);
    res.status(500).json({ message: 'Error deleting map zone' });
  }
};