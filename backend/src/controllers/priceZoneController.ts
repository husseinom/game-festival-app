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
        tableTypes: true,
        mapZones: true
      }
    });

    // Calculate actual table totals from PriceZone TableTypes
    const zonesWithCalculatedTotals = zones.map((zone) => {
      let small_tables = 0;
      let large_tables = 0;
      let city_tables = 0;

      // Calculate from PriceZone TableTypes
      for (const tt of zone.tableTypes || []) {
        if (tt.name === 'STANDARD') small_tables += tt.nb_total;
        else if (tt.name === 'LARGE') large_tables += tt.nb_total;
        else if (tt.name === 'CITY') city_tables += tt.nb_total;
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
        tableTypes: true,
        mapZones: true
      }
    });

    // Calculate totals from PriceZone TableTypes
    const zonesWithCalculatedTotals = zones.map(zone => {
      let small_tables = 0;
      let large_tables = 0;
      let city_tables = 0;

      for (const tt of zone.tableTypes || []) {
        if (tt.name === 'STANDARD') small_tables += tt.nb_total;
        else if (tt.name === 'LARGE') large_tables += tt.nb_total;
        else if (tt.name === 'CITY') city_tables += tt.nb_total;
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
    await prisma.$transaction(async (tx) => {
      // Get current zone with TableTypes
      const currentZone = await tx.priceZone.findUnique({ 
        where: { id },
        include: { 
          tableTypes: true,
          mapZones: true
        }
      });
      
      if (!currentZone) {
        throw new Error('Price zone not found');
      }

      // Calculate current totals from TableTypes on PriceZone
      let currentSmall = 0, currentLarge = 0, currentCity = 0;
      for (const tt of currentZone.tableTypes || []) {
        if (tt.name === 'STANDARD') currentSmall += tt.nb_total;
        else if (tt.name === 'LARGE') currentLarge += tt.nb_total;
        else if (tt.name === 'CITY') currentCity += tt.nb_total;
      }

      // Find other price zone in same festival
      const otherZone = await tx.priceZone.findFirst({
        where: {
          festival_id: currentZone.festival_id,
          id: { not: id }
        },
        include: {
          tableTypes: true
        }
      });

      // If updating tables and there's another zone, transfer tables
      if ((small_tables !== undefined || large_tables !== undefined || city_tables !== undefined) && otherZone) {
        const newSmallTables = small_tables !== undefined ? small_tables : currentSmall;
        const newLargeTables = large_tables !== undefined ? large_tables : currentLarge;
        const newCityTables = city_tables !== undefined ? city_tables : currentCity;

        // Calculate festival totals (should remain constant)
        const festivalTotals = await TableConverter.calculateFestivalTotals(tx, currentZone.festival_id);
        
        // Validate: can't exceed festival totals
        if (newSmallTables > festivalTotals.small_tables || 
            newLargeTables > festivalTotals.large_tables || 
            newCityTables > festivalTotals.city_tables) {
          throw new Error('Cannot allocate more tables than festival total');
        }

        // Calculate what the other zone should have (remainder)
        const otherSmallTables = festivalTotals.small_tables - newSmallTables;
        const otherLargeTables = festivalTotals.large_tables - newLargeTables;
        const otherCityTables = festivalTotals.city_tables - newCityTables;

        // Validate: other zone can't go negative
        if (otherSmallTables < 0 || otherLargeTables < 0 || otherCityTables < 0) {
          throw new Error('Cannot transfer more tables than available in other zone');
        }

        // ✅ Update TableTypes for CURRENT zone directly on PriceZone
        for (const [tableSizeName, newCount] of Object.entries({
          STANDARD: newSmallTables,
          LARGE: newLargeTables,
          CITY: newCityTables
        })) {
          const existing = currentZone.tableTypes.find(tt => tt.name === tableSizeName);
          const reservedCount = (existing?.nb_total || 0) - (existing?.nb_available || 0);

          if (existing) {
            if (newCount > 0) {
              // ✅ Set to new total, keep reserved tables, adjust available
              const newAvailable = Math.max(0, newCount - reservedCount);
              
              await tx.tableType.update({
                where: { id: existing.id },
                data: { 
                  nb_total: newCount,
                  nb_available: newAvailable
                }
              });
            } else {
              // Delete if newCount is 0
              await tx.tableType.delete({ where: { id: existing.id } });
            }
          } else if (newCount > 0) {
            // Create new TableType on PriceZone
            const playerCount = tableSizeName === 'STANDARD' ? 4 : tableSizeName === 'LARGE' ? 6 : 8;
            await tx.tableType.create({
              data: {
                price_zone_id: id,
                name: tableSizeName as any,
                nb_total: newCount,
                nb_available: newCount,
                nb_total_player: playerCount
              }
            });
          }
        }

        // ✅ Update TableTypes for OTHER zone directly on PriceZone
        for (const [tableSizeName, newCount] of Object.entries({
          STANDARD: otherSmallTables,
          LARGE: otherLargeTables,
          CITY: otherCityTables
        })) {
          const existing = otherZone.tableTypes.find(tt => tt.name === tableSizeName);
          const reservedCount = (existing?.nb_total || 0) - (existing?.nb_available || 0);

          if (existing) {
            if (newCount > 0) {
              // ✅ Set to new total, keep reserved tables, adjust available
              const newAvailable = Math.max(0, newCount - reservedCount);
              
              await tx.tableType.update({
                where: { id: existing.id },
                data: { 
                  nb_total: newCount,
                  nb_available: newAvailable
                }
              });
            } else {
              // Delete if newCount is 0
              await tx.tableType.delete({ where: { id: existing.id } });
            }
          } else if (newCount > 0) {
            // Create new TableType on other PriceZone
            const playerCount = tableSizeName === 'STANDARD' ? 4 : tableSizeName === 'LARGE' ? 6 : 8;
            await tx.tableType.create({
              data: {
                price_zone_id: otherZone.id,
                name: tableSizeName as any,
                nb_total: newCount,
                nb_available: newCount,
                nb_total_player: playerCount
              }
            });
          }
        }
      }

      // Handle map zone reassignment
      if (mapZoneIds !== undefined) {
        const currentMapZoneIds = currentZone.mapZones.map(mz => mz.id);
        const toAdd = mapZoneIds.filter((mzId: number) => !currentMapZoneIds.includes(mzId));
        const toRemove = currentMapZoneIds.filter(mzId => !mapZoneIds.includes(mzId));

        for (const mzId of toAdd) {
          await tx.mapZone.update({
            where: { id: mzId },
            data: { price_zone_id: id }
          });
        }

        for (const mzId of toRemove) {
          if (otherZone) {
            await tx.mapZone.update({
              where: { id: mzId },
              data: { price_zone_id: otherZone.id }
            });
          }
        }
      }

      // Update price zone (only table_price)
      await tx.priceZone.update({
        where: { id },
        data: {
          ...(table_price !== undefined && { table_price })
        }
      });
    });

    // Return ALL zones for the festival with recalculated totals
    const currentZoneData = await prisma.priceZone.findUnique({ 
      where: { id }, 
      select: { festival_id: true } 
    });
    
    if (!currentZoneData) {
      throw new Error('Price zone not found');
    }

    const allZones = await prisma.priceZone.findMany({
      where: { festival_id: currentZoneData.festival_id },
      include: {
        tableTypes: true,
        mapZones: true
      },
      orderBy: { id: 'asc' }
    });

    // Calculate totals for each zone from PriceZone tableTypes
    const zonesWithTotals = allZones.map(zone => {
      let small = 0, large = 0, city = 0;
      for (const tt of zone.tableTypes || []) {
        if (tt.name === 'STANDARD') small += tt.nb_total;
        else if (tt.name === 'LARGE') large += tt.nb_total;
        else if (tt.name === 'CITY') city += tt.nb_total;
      }

      return {
        ...zone,
        small_tables: small,
        large_tables: large,
        city_tables: city,
        total_tables: small + large + city
      };
    });

    res.json(zonesWithTotals);
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