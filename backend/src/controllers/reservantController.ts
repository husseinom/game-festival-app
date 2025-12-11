import type { Request, Response } from 'express';
import * as reservantService from '../services/reservantService.js';

export const add = async (req: Request, res: Response) => {
  try {
    const reservant = await reservantService.createReservant(req.body);
    res.status(201).json({ message: 'Reservant créé', data: reservant });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du reservant' });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const list = await reservantService.getAllReservants();
    res.status(200).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const reservant = await reservantService.getReservantById(id);
    if (!reservant) {
      res.status(404).json({ error: 'Reservant introuvable' });
      return;
    }
    res.status(200).json(reservant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const remove = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await reservantService.deleteReservant(id);
    res.status(200).json({ message: 'Reservant supprimé' });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') { // Prisma: record not found
      res.status(404).json({ error: 'Reservant introuvable' });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
