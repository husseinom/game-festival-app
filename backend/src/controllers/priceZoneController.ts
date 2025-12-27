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