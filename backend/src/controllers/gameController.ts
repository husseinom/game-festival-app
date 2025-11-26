import type { Request, Response } from 'express';
import * as gameService from '../services/gameService.js'; 
import prisma from '../config/prisma.js';

export const add = async (req: Request, res: Response) => {
  try {
    const game = await gameService.createGame(req.body);

    res.status(201).json({
      message: 'Game created successfully',
      data: game
    });

  } catch (error: any) {
    if (error.message === 'The specified game publisher does not exist.') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'A game with the same name already exists for this publisher.') {
      res.status(409).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getAllGames = async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        min_age: true,
        logo_url: true,
        publisher: {
          select: {
            id: true,
            name: true,
          }
        }
     },
    });

    res.status(200).json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGameById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const game = await prisma.game.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        type: true,
        min_age: true,
        logo_url: true,
        publisher: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}