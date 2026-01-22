import type { Request, Response } from 'express';
import * as festivalService from '../services/festivalService.js';
import prisma from '../config/prisma.js';
import { TableConverter } from '../utils/tableConverter.js';

export const add = async (req: Request, res: Response) => {
  try {
    const newFestival = await festivalService.createFestival(req.body);
    
    // Calculate tables from MapZones (will be 0 initially)
    const totals = await TableConverter.calculateFestivalTotals(prisma, newFestival.id);
    
    res.status(201).json({
      ...newFestival,
      ...totals
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erreur lors de la création du festival' });
  }
};

export const getAllFestivals = async (req: Request, res: Response) => {
  try {
    const festivals = await prisma.festival.findMany({
      include: {
        priceZoneType: true,
        priceZones: true
      }
    });

    // Calculate tables for each festival
    const festivalsWithTables = await Promise.all(
      festivals.map(async (festival) => {
        const totals = await TableConverter.calculateFestivalTotals(prisma, festival.id);
        return {
          ...festival,
          ...totals
        };
      })
    );

    res.status(200).json(festivalsWithTables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getFestivalById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const festival = await prisma.festival.findUnique({
      where: { id: Number(id) },
      include: {
        priceZoneType: true,
        priceZones: true,
        mapZones: {
          include: { tableTypes: true }
        }
      }
    });

    if (!festival) {
      return res.status(404).json({ error: 'Festival not found' });
    }

    // Calculate totals from MapZone TableTypes
    const totals = await TableConverter.calculateFestivalTotals(prisma, festival.id);

    // Return festival with calculated legacy fields
    const response = {
      ...festival,
      ...totals
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedFestival = await festivalService.updateFestival(Number(id), req.body);
    
    // Calculate tables after update
    const totals = await TableConverter.calculateFestivalTotals(prisma, updatedFestival.id);
    
    res.status(200).json({
      ...updatedFestival,
      ...totals
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erreur lors de la mise à jour du festival' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await festivalService.deleteFestival(Number(id));
    res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erreur lors de la suppression du festival' });
  }
};