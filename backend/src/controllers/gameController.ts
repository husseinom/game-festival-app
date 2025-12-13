import type { Request, Response } from 'express';
import * as gameService from '../services/gameService.js'; 
import prisma from '../config/prisma.js';

export const getAllGameTypes = async (req: Request, res: Response) => {
  try {
    const gameTypes = await prisma.gameType.findMany({
      orderBy: { label: 'asc' }
    });
    res.status(200).json(gameTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const add = async (req: Request, res: Response) => {
  try {
    const game = await gameService.createGame(req.body);

    res.status(201).json(game);

  } catch (error: any) {
    if (error.message === 'The specified game publisher does not exist.') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'A game with the same name already exists for this publisher.') {
      res.status(409).json({ error: error.message });
    } else if (error.message.includes('does not exist. Available types:')) {
      res.status(400).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getAllGames = async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      include: {
        publisher: true,
        type: true
      }
    });

    // Transformer les données au format attendu par le frontend
    const formattedGames = games.map(game => ({
      id: game.id,
      name: game.name,
      type: game.type?.label || '', // Le frontend attend un string
      min_age: game.minAge,
      max_players: game.maxPlayers,
      logo_url: game.imageUrl,
      game_publisher_id: game.publisherId,
      publisher: game.publisher ? {
        id: game.publisher.id,
        name: game.publisher.name,
        logoUrl: game.publisher.logoUrl
      } : undefined
    }));

    res.status(200).json(formattedGames);
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
      include: {
        publisher: true,
        type: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Transformer les données au format attendu par le frontend
    const formattedGame = {
      id: game.id,
      name: game.name,
      type: game.type?.label || '',
      min_age: game.minAge,
      max_players: game.maxPlayers,
      logo_url: game.imageUrl,
      game_publisher_id: game.publisherId,
      publisher: game.publisher ? {
        id: game.publisher.id,
        name: game.publisher.name,
        logoUrl: game.publisher.logoUrl
      } : undefined
    };

    res.status(200).json(formattedGame);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const updateGame = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const game = await gameService.updateGame(Number(id), req.body);

    res.status(200).json(game);
  } catch (error: any) {
    if (error.message === 'Game not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'The specified game publisher does not exist.') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'A game with the same name already exists for this publisher.') {
      res.status(409).json({ error: error.message });
    } else if (error.message.includes('does not exist. Available types:')) {
      res.status(400).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteGame = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await gameService.deleteGame(Number(id));
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Game not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};