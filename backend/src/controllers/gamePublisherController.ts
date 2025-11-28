import type { Request, Response } from 'express';
import * as gamePublisherService from '../services/gamePublisherService.js';
import * as gameService from '../services/gameService.js';
import prisma from '../config/prisma.js';

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

export const getAllGamePublishers = async (req: Request, res: Response) => {
  try {
    const publishers = await prisma.game_Publisher.findMany({
      select: {
        id: true,
        name: true,
        logo: true,
     }
    });

    res.status(200).json(publishers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGamePublisherById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const publisher = await prisma.game_Publisher.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        logo: true,
      }
    });

    if (!publisher) {
      return res.status(404).json({ error: 'Game publisher not found' });
    }

    res.status(200).json(publisher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const updateGamePublisher = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const publisher = await gamePublisherService.updateGamePublisher(Number(id), req.body);

    res.status(200).json({
      message: 'Game publisher updated successfully',
      data: publisher
    });
  } catch (error: any) {
    if (error.message === 'Game publisher not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'This game publisher already exists.') {
      res.status(409).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteGamePublisher = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await gamePublisherService.deleteGamePublisher(Number(id));
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Game publisher not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getGamesByPublisherId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const publisher = await prisma.game_Publisher.findUnique({
      where: { id: Number(id) },
      include: {
        games: {
          select: {
            id: true,
            name: true,
            type: true,
            min_age: true,
            logo_url: true,
          }
        }
      }
    });

    if (!publisher) {
      return res.status(404).json({ error: 'Game publisher not found' });
    }

    res.status(200).json(publisher.games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addGameToPublisher = async (req: Request, res: Response) => {
  const { id } = req.params;
  const gameData = { ...req.body, game_publisher_id: Number(id) };

  try {
    const game = await gameService.createGame(gameData);

    res.status(201).json({
      message: 'Game created successfully for the publisher',
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
