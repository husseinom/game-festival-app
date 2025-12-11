import type { Request, Response } from 'express';
import * as reservationService from '../services/reservationService.js';

export const add = async (req: Request, res: Response) => {
  try {
    const reservation = await reservationService.createReservation(req.body);
    res.status(201).json({ message: 'Reservation créée', data: reservation });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la reservation' });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const list = await reservationService.getAllReservations();
    res.status(200).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const reservation = await reservationService.getReservationById(id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation introuvable' });
      return;
    }
    res.status(200).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const update = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await reservationService.updateReservation(id, req.body);
    res.status(200).json({ message: 'Reservation mise à jour', data: updated });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Reservation introuvable' });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const remove = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await reservationService.deleteReservation(id);
    res.status(200).json({ message: 'Reservation supprimée' });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Reservation introuvable' });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
