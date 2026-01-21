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
        price_zone: true,
        tableTypes: true,
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
        tableTypes: true,
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

    // Get the price zone to check available tables
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

    // Create map zone
    const mapZone = await prisma.mapZone.create({
      data: { 
        name, 
        price_zone_id,
        festival_id: priceZone.festival_id,
        small_tables: requestedSmall,
        large_tables: requestedLarge,
        city_tables: requestedCity
      }
    });

    // Create TableTypes for this map zone
    const tableTypesToCreate = [];
    if (requestedSmall > 0) {
      tableTypesToCreate.push({
        map_zone_id: mapZone.id,
        name: 'STANDARD' as const,
        nb_total: requestedSmall,
        nb_available: requestedSmall,
        nb_total_player: 4
      });
    }
    if (requestedLarge > 0) {
      tableTypesToCreate.push({
        map_zone_id: mapZone.id,
        name: 'LARGE' as const,
        nb_total: requestedLarge,
        nb_available: requestedLarge,
        nb_total_player: 6
      });
    }
    if (requestedCity > 0) {
      tableTypesToCreate.push({
        map_zone_id: mapZone.id,
        name: 'CITY' as const,
        nb_total: requestedCity,
        nb_available: requestedCity,
        nb_total_player: 8
      });
    }
    
    if (tableTypesToCreate.length > 0) {
      await prisma.tableType.createMany({
        data: tableTypesToCreate
      });
    }

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
    
    await prisma.festivalGame.updateMany({
      where: { map_zone_id: id },
      data: { map_zone_id: null }
    });
    await prisma.mapZone.delete({ where: { id: id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting map zone:', error);
    res.status(500).json({ message: 'Error deleting map zone' });
  }
};