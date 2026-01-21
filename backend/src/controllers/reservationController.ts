import type { Request, Response } from 'express';
import * as reservationService from '../services/reservationService.js';
import { ReservationStatus, InvoiceStatus, TableSize } from '@prisma/client';

// ============================================
// CRUD de base
// ============================================

export const add = async (req: Request, res: Response) => {
  try {
    const reservation = await reservationService.createReservation(req.body);
    res.status(201).json({ message: 'Reservation créée', data: reservation });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erreur lors de la création de la reservation' });
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

export const getByFestival = async (req: Request, res: Response) => {
  const festivalId = Number(req.params.festivalId);
  try {
    const list = await reservationService.getReservationsByFestival(festivalId);
    res.status(200).json(list);
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

// ============================================
// Workflow de suivi (statuts)
// ============================================

export const updateStatus = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!status || !Object.values(ReservationStatus).includes(status)) {
    res.status(400).json({ error: 'Statut invalide' });
    return;
  }

  try {
    const updated = await reservationService.updateStatus(id, status);
    res.status(200).json({ message: 'Statut mis à jour', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateStatusBatch = async (req: Request, res: Response) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Liste d\'IDs requise' });
    return;
  }

  if (!status || !Object.values(ReservationStatus).includes(status)) {
    res.status(400).json({ error: 'Statut invalide' });
    return;
  }

  try {
    const updated = await reservationService.updateStatusBatch(ids.map(Number), status);
    res.status(200).json({ message: `${updated.length} réservations mises à jour`, data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// Facturation
// ============================================

export const markAsInvoiced = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await reservationService.markAsInvoiced(id);
    res.status(200).json({ message: 'Réservation marquée comme facturée', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const markAsPaid = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await reservationService.markAsPaid(id);
    res.status(200).json({ message: 'Réservation marquée comme payée', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateInvoiceStatusBatch = async (req: Request, res: Response) => {
  const { ids, invoice_status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Liste d\'IDs requise' });
    return;
  }

  if (!invoice_status || !Object.values(InvoiceStatus).includes(invoice_status)) {
    res.status(400).json({ error: 'Statut de facturation invalide' });
    return;
  }

  try {
    const updated = await reservationService.updateInvoiceStatusBatch(ids.map(Number), invoice_status);
    res.status(200).json({ message: `${updated.length} réservations mises à jour`, data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const applyPartnerDiscount = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await reservationService.applyPartnerDiscount(id);
    res.status(200).json({ message: 'Remise partenaire appliquée', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erreur lors de l\'application de la remise' });
  }
};

export const recalculatePrice = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await reservationService.recalculatePrice(id);
    res.status(200).json({ message: 'Prix recalculé', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// Phase logistique - Liste des jeux
// ============================================

export const requestGameList = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await reservationService.requestGameList(id);
    res.status(200).json({ message: 'Liste des jeux demandée', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const markGameListReceived = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await reservationService.markGameListReceived(id);
    res.status(200).json({ message: 'Liste des jeux reçue', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const addGames = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { games } = req.body;

  if (!games || !Array.isArray(games) || games.length === 0) {
    res.status(400).json({ error: 'Liste de jeux requise' });
    return;
  }

  try {
    const updated = await reservationService.addGamesToReservation(id, games);
    res.status(200).json({ message: 'Jeux ajoutés à la réservation', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const markGamesReceived = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const updated = await reservationService.markGamesReceived(id);
    res.status(200).json({ message: 'Jeux marqués comme reçus', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const removeGame = async (req: Request, res: Response) => {
  const festivalGameId = Number(req.params.gameId);
  try {
    const updated = await reservationService.removeGameFromReservation(festivalGameId);
    res.status(200).json({ message: 'Jeu supprimé de la réservation', data: updated });
  } catch (error: any) {
    console.error(error);
    if (error.message === 'Jeu non trouvé dans la réservation') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

export const markGameAsReceived = async (req: Request, res: Response) => {
  const festivalGameId = Number(req.params.gameId);
  try {
    const updated = await reservationService.markGameAsReceived(festivalGameId);
    res.status(200).json({ message: 'Jeu marqué comme reçu', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// Phase technique - Placement
// ============================================

export const placeGame = async (req: Request, res: Response) => {
  const festivalGameId = Number(req.params.gameId);
  const { map_zone_id, table_size, allocated_tables } = req.body;

  if (!map_zone_id || !table_size || !allocated_tables) {
    res.status(400).json({ error: 'map_zone_id, table_size et allocated_tables sont requis' });
    return;
  }

  if (!Object.values(TableSize).includes(table_size)) {
    res.status(400).json({ error: 'Type de table invalide (STANDARD, LARGE, CITY)' });
    return;
  }

  try {
    const updated = await reservationService.placeGame(
      festivalGameId,
      Number(map_zone_id),
      table_size,
      Number(allocated_tables)
    );
    res.status(200).json({ message: 'Jeu placé', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erreur lors du placement' });
  }
};

export const unplaceGame = async (req: Request, res: Response) => {
  const festivalGameId = Number(req.params.gameId);
  try {
    const updated = await reservationService.unplaceGame(festivalGameId);
    res.status(200).json({ message: 'Placement retiré', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erreur lors du retrait du placement' });
  }
};

// ============================================
// Historique des contacts
// ============================================

export const addContactLog = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { notes } = req.body;

  if (!notes) {
    res.status(400).json({ error: 'Notes requises' });
    return;
  }

  try {
    const updated = await reservationService.addContactLog(id, notes);
    res.status(200).json({ message: 'Note de contact ajoutée', data: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getContactLogs = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const logs = await reservationService.getContactLogs(id);
    res.status(200).json(logs);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// Statistiques
// ============================================

export const getStats = async (req: Request, res: Response) => {
  const festivalId = Number(req.params.festivalId);
  try {
    const stats = await reservationService.getReservationStats(festivalId);
    res.status(200).json(stats);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
