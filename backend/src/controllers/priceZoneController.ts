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

    const zoneReservations = await prisma.zoneReservation.findMany({
      where: { price_zone_id: priceZoneId },
      include: {
        reservation: {
          include: {
            publisher: true,
            reservant: true,
            games: {
              include: {
                game: true
              }
            }
          }
        }
      }
    });

    // Flatten the structure for frontend
    const reservations = zoneReservations.map(zr => ({
      ...zr.reservation,
      table_count: zr.table_count
    }));

    res.json(reservations);
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

    // Get all reservations for this price zone
    const zoneReservations = await prisma.zoneReservation.findMany({
      where: { price_zone_id: priceZoneId },
      select: { reservation_id: true }
    });

    const reservationIds = zoneReservations.map(zr => zr.reservation_id);

    if (reservationIds.length === 0) {
      return res.json([]);
    }

    // Get all festival games for these reservations
    const festivalGames = await prisma.festivalGame.findMany({
      where: { 
        reservation_id: { in: reservationIds }
      },
      include: {
        game: true,
        reservation: {
          include: {
            publisher: true
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