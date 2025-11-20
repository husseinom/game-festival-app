import type { Request, Response } from 'express';
import * as festivalService from '../services/festivalService.js';
import prisma from '../config/prisma.js';

export const add = async (req: Request, res: Response) => {
  try {
    // call service
    const festival = await festivalService.createFestival(req.body);
    
    res.status(201).json({
      message: 'Festival created successfully',
      data: festival
    });
  } catch (error: any) {
    if (error.message === 'This festival already exists at this location and date.') {
      res.status(409).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Intern server error' });
    }
  }
};

export const getAllFestivals = async (req: Request, res: Response) => {
  try {
    const festivals = await prisma.festival.findMany({
      select: {
        id: true,
        name: true,
        logo: true,
        location: true,
        total_tables: true,
        startDate: true,
        endDate: true,
     }
    });
    
    res.status(200).json(festivals);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};