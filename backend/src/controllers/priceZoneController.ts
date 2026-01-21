import type { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getAllTypes = async (_req: Request, res: Response) => {
  try {
    const types = await prisma.priceZoneType.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load price zone types' });
  }
};

export const getAllZones = async(_req: Request, res: Response)=>{
  try{
    const zones = await prisma.priceZone.findMany({orderBy: {name: 'asc'}});
    res.status(200).json(zones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load price zones' });
  }
}

export const getZonesByFestival = async (req: Request, res: Response) => {
  try {
    const festivalId = Number(req.params.festivalId);
    if (Number.isNaN(festivalId)) {
      return res.status(400).json({ error: 'Invalid festivalId' });
    }

    const zones = await prisma.priceZone.findMany({
      where: { festival_id: festivalId },
      orderBy: { name: 'asc' },
      include: { mapZones: true } // optional
    });

    res.status(200).json(zones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load price zones for festival' });
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
        game: true,
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