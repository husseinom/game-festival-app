import type { Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { TableConverter } from '../utils/tableConverter.js';

export const getAllTypes = async (_req: Request, res: Response) => {
  try {
    const types = await prisma.priceZoneType.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load price zone types' });
  }
};

export const getAllZones = async(_req: Request, res: Response) => {
  try {
    const zones = await prisma.priceZone.findMany({
      orderBy: { name: 'asc' },
      include: {
        mapZones: {
          include: {
            tableTypes: true // Include TableTypes to calculate totals
          }
        }
      }
    });

    // Calculate actual table totals from MapZone TableTypes
    const zonesWithCalculatedTotals = await Promise.all(
      zones.map(async (zone) => {
        let small_tables = 0;
        let large_tables = 0;
        let city_tables = 0;

        // Calculate from MapZone TableTypes
        for (const mapZone of zone.mapZones) {
          if (mapZone.tableTypes && mapZone.tableTypes.length > 0) {
            for (const tt of mapZone.tableTypes) {
              if (tt.name === 'STANDARD') small_tables += tt.nb_total;
              else if (tt.name === 'LARGE') large_tables += tt.nb_total;
              else if (tt.name === 'CITY') city_tables += tt.nb_total;
            }
          }
        }

        return {
          ...zone,
          small_tables,
          large_tables,
          city_tables,
          total_tables: small_tables + large_tables + city_tables
        };
      })
    );

    res.status(200).json(zonesWithCalculatedTotals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load price zones' });
  }
};

export const getZonesByFestival = async (req: Request, res: Response) => {
  try {
    const festivalId = Number(req.params.festivalId);
    if (Number.isNaN(festivalId)) {
      return res.status(400).json({ error: 'Invalid festivalId' });
    }

    const zones = await prisma.priceZone.findMany({
      where: { festival_id: festivalId },
      orderBy: { name: 'asc' },
      include: { 
        mapZones: {
          include: {
            tableTypes: true // Include TableTypes
          }
        }
      }
    });

    // Calculate totals from MapZone TableTypes
    const zonesWithCalculatedTotals = zones.map(zone => {
      let small_tables = 0;
      let large_tables = 0;
      let city_tables = 0;

      for (const mapZone of zone.mapZones) {
        if (mapZone.tableTypes && mapZone.tableTypes.length > 0) {
          for (const tt of mapZone.tableTypes) {
            if (tt.name === 'STANDARD') small_tables += tt.nb_total;
            else if (tt.name === 'LARGE') large_tables += tt.nb_total;
            else if (tt.name === 'CITY') city_tables += tt.nb_total;
          }
        }
      }

      return {
        ...zone,
        small_tables,
        large_tables,
        city_tables,
        total_tables: small_tables + large_tables + city_tables
      };
    });

    res.status(200).json(zonesWithCalculatedTotals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load price zones for festival' });
  }
};

export const updatePriceZone = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid priceZoneId' });
    }

    const { table_price, small_tables, large_tables, city_tables, mapZoneIds } = req.body;

    // Start transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Get current zone with MapZones and TableTypes
      const currentZone = await tx.priceZone.findUnique({ 
        where: { id },
        include: { 
          mapZones: {
            include: {
              tableTypes: true
            }
          }
        }
      });
      
      if (!currentZone) {
        throw new Error('Price zone not found');
      }

      // Calculate current totals from TableTypes
      let currentSmall = 0, currentLarge = 0, currentCity = 0;
      for (const mapZone of currentZone.mapZones) {
        for (const tt of mapZone.tableTypes || []) {
          if (tt.name === 'STANDARD') currentSmall += tt.nb_total;
          else if (tt.name === 'LARGE') currentLarge += tt.nb_total;
          else if (tt.name === 'CITY') currentCity += tt.nb_total;
        }
      }

      // Find other price zone in same festival
      const otherZone = await tx.priceZone.findFirst({
        where: {
          festival_id: currentZone.festival_id,
          id: { not: id }
        },
        include: {
          mapZones: {
            include: {
              tableTypes: true
            }
          }
        }
      });

      // If updating tables and there's another zone
      if ((small_tables !== undefined || large_tables !== undefined || city_tables !== undefined) && otherZone) {
        const newSmallTables = small_tables !== undefined ? small_tables : currentSmall;
        const newLargeTables = large_tables !== undefined ? large_tables : currentLarge;
        const newCityTables = city_tables !== undefined ? city_tables : currentCity;

        // Note: With TableTypes, you can't directly "move" tables between price zones
        // Tables are allocated at MapZone level via TableTypes
        // This validation ensures you're not exceeding festival totals
        
        const festivalTotals = await TableConverter.calculateFestivalTotals(tx, currentZone.festival_id);
        
        if (newSmallTables > festivalTotals.small_tables || 
            newLargeTables > festivalTotals.large_tables || 
            newCityTables > festivalTotals.city_tables) {
          throw new Error('Cannot allocate more tables than festival total');
        }
      }

      // Handle map zone reassignment
      if (mapZoneIds !== undefined) {
        const currentMapZoneIds = currentZone.mapZones.map(mz => mz.id);
        const toAdd = mapZoneIds.filter((mzId: number) => !currentMapZoneIds.includes(mzId));
        const toRemove = currentMapZoneIds.filter(mzId => !mapZoneIds.includes(mzId));

        // Add map zones to this price zone
        for (const mzId of toAdd) {
          await tx.mapZone.update({
            where: { id: mzId },
            data: { price_zone_id: id }
          });
        }

        // Remove map zones from this price zone (move to other zone if exists)
        for (const mzId of toRemove) {
          if (otherZone) {
            await tx.mapZone.update({
              where: { id: mzId },
              data: { price_zone_id: otherZone.id }
            });
          }
        }
      }

      // Update price zone (only table_price, not table counts)
      const updatedZone = await tx.priceZone.update({
        where: { id },
        data: {
          ...(table_price !== undefined && { table_price })
          // Don't update small_tables, large_tables, city_tables
          // They're calculated from MapZone TableTypes
        },
        include: { 
          mapZones: {
            include: {
              tableTypes: true
            }
          }
        }
      });

      // Calculate totals from TableTypes
      let small = 0, large = 0, city = 0;
      for (const mapZone of updatedZone.mapZones) {
        for (const tt of mapZone.tableTypes || []) {
          if (tt.name === 'STANDARD') small += tt.nb_total;
          else if (tt.name === 'LARGE') large += tt.nb_total;
          else if (tt.name === 'CITY') city += tt.nb_total;
        }
      }

      return {
        ...updatedZone,
        small_tables: small,
        large_tables: large,
        city_tables: city,
        total_tables: small + large + city
      };
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating price zone:', err);
    res.status(500).json({ error: err.message || 'Failed to update price zone' });
  }
};

export const deletePriceZone = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid priceZoneId' });
    }

    // Use transaction to handle foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Get the price zone to delete
      const priceZoneToDelete = await tx.priceZone.findUnique({
        where: { id },
        include: { mapZones: true, zoneReservations: true }
      });

      if (!priceZoneToDelete) {
        throw new Error('Price zone not found');
      }

      // Check if there are reservations
      if (priceZoneToDelete.zoneReservations.length > 0) {
        throw new Error('Cannot delete price zone with existing reservations');
      }

      // Find the other price zone in the same festival
      const otherZone = await tx.priceZone.findFirst({
        where: {
          festival_id: priceZoneToDelete.festival_id,
          id: { not: id }
        }
      });

      // Reassign all map zones to the other price zone
      if (otherZone && priceZoneToDelete.mapZones.length > 0) {
        await tx.mapZone.updateMany({
          where: { price_zone_id: id },
          data: { price_zone_id: otherZone.id }
        });
      } else if (!otherZone && priceZoneToDelete.mapZones.length > 0) {
        // If there's no other price zone, delete the map zones (or handle differently)
        throw new Error('Cannot delete the last price zone with map zones');
      }

      // Now delete the price zone
      await tx.priceZone.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting price zone:', err);
    
    if (err.message === 'Cannot delete price zone with existing reservations') {
      return res.status(400).json({ error: 'Cannot delete price zone with existing reservations' });
    }
    
    if (err.message === 'Cannot delete the last price zone with map zones') {
      return res.status(400).json({ error: 'Cannot delete the last price zone with map zones' });
    }

    res.status(500).json({ error: 'Failed to delete price zone' });
  }
};

export const create = async (req: Request, res: Response) => {
  // admin only endpoint
  try {
    const { key, name} = req.body;
    const created = await prisma.priceZoneType.create({ data: { key, name} });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create price zone type' });
  }
};

export const getReservationsByPriceZone = async (req: Request, res: Response) => {
  try {
    const priceZoneId = Number(req.params.priceZoneId);
    
    if (Number.isNaN(priceZoneId)) {
      return res.status(400).json({ error: 'Invalid priceZoneId' });
    }

    // Get all MapZones for this PriceZone
    const mapZones = await prisma.mapZone.findMany({
      where: { price_zone_id: priceZoneId },
      select: { id: true }
    });
    
    const mapZoneIds = mapZones.map(mz => mz.id);

    // Get reservations that have games placed in these MapZones
    const festivalGames = await prisma.festivalGame.findMany({
      where: { 
        map_zone_id: { in: mapZoneIds }
      },
      select: { reservation_id: true },
      distinct: ['reservation_id']
    });

    const reservationIdsFromGames = festivalGames.map(fg => fg.reservation_id);

    // Also get reservations from ZoneReservation (explicit zone allocation)
    const zoneReservations = await prisma.zoneReservation.findMany({
      where: { price_zone_id: priceZoneId },
      select: { reservation_id: true, table_count: true }
    });

    // Merge unique reservation IDs
    const allReservationIds = [...new Set([
      ...reservationIdsFromGames,
      ...zoneReservations.map(zr => zr.reservation_id)
    ])];

    if (allReservationIds.length === 0) {
      return res.json([]);
    }

    // Get full reservation details
    const reservations = await prisma.reservation.findMany({
      where: { reservation_id: { in: allReservationIds } },
      include: {
        publisher: true,
        reservant: true,
        games: {
          where: { map_zone_id: { in: mapZoneIds } },
          include: {
            game: true,
            mapZone: true
          }
        }
      }
    });

    // Add table_count from ZoneReservation if available
    const reservationsWithTableCount = reservations.map(r => {
      const zr = zoneReservations.find(z => z.reservation_id === r.reservation_id);
      return {
        ...r,
        table_count: zr?.table_count || r.games.reduce((sum, g) => sum + (g.allocated_tables || 0), 0)
      };
    });

    res.json(reservationsWithTableCount);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
};

export const getGamesByPriceZone = async (req: Request, res: Response) => {
  try {
    const priceZoneId = Number(req.params.priceZoneId);
    
    if (Number.isNaN(priceZoneId)) {
      return res.status(400).json({ error: 'Invalid priceZoneId' });
    }

    // Get all MapZones for this PriceZone
    const mapZones = await prisma.mapZone.findMany({
      where: { price_zone_id: priceZoneId },
      select: { id: true }
    });
    
    const mapZoneIds = mapZones.map(mz => mz.id);

    // Get all festival games placed in these MapZones
    const festivalGames = await prisma.festivalGame.findMany({
      where: { 
        map_zone_id: { in: mapZoneIds }
      },
      include: {
        game: {
          include: {
            type: true,
            publisher: true
          }
        },
        reservation: {
          include: {
            publisher: true,
            reservant: true
          }
        },
        mapZone: true
      }
    });

    res.json(festivalGames);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'Error fetching games' });
  }
};