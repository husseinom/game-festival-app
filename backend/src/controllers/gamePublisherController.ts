import type { Request, Response } from 'express';
import * as gamePublisherService from '../services/gamePublisherService.js';

export const add = async (req: Request, res: Response) => {
  try {
    const publisher = await gamePublisherService.createGamePublisher(req.body);

    res.status(201).json({
      message: 'Game publisher created successfully',
      data: publisher
    });
    
  } catch (error: any) {
    if (error.message === 'This game publisher already exists.') {
      res.status(409).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};