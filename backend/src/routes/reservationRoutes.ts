import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as reservationController from '../controllers/reservationController.js';

const router = Router();
const orgRoles = ['ADMIN', 'SUPER_ORGANISATOR'];

// ============================================
// CRUD de base
// ============================================

// POST /api/reservations/add
router.post('/add', verifyToken, requireRole(orgRoles), reservationController.add);

// GET /api/reservations/all
router.get('/all', verifyToken, requireRole(orgRoles), reservationController.getAll);

// GET /api/reservations/festival/:festivalId
router.get('/festival/:festivalId', verifyToken, requireRole(orgRoles), reservationController.getByFestival);

// GET /api/reservations/festival/:festivalId/stats
router.get('/festival/:festivalId/stats', verifyToken, requireRole(orgRoles), reservationController.getStats);

// GET /api/reservations/:id
router.get('/:id', verifyToken, requireRole(orgRoles), reservationController.getById);

// PUT /api/reservations/:id
router.put('/:id', verifyToken, requireRole(orgRoles), reservationController.update);

// DELETE /api/reservations/:id
router.delete('/:id', verifyToken, requireRole(orgRoles), reservationController.remove);

// ============================================
// Workflow de suivi (statuts) - Mise à jour en masse depuis la liste
// ============================================

// PATCH /api/reservations/:id/status
router.patch('/:id/status', verifyToken, requireRole(orgRoles), reservationController.updateStatus);

// PATCH /api/reservations/batch/status - Mise à jour en masse
router.patch('/batch/status', verifyToken, requireRole(orgRoles), reservationController.updateStatusBatch);

// ============================================
// Facturation
// ============================================

// POST /api/reservations/:id/invoice - Marquer comme facturée
router.post('/:id/invoice', verifyToken, requireRole(orgRoles), reservationController.markAsInvoiced);

// POST /api/reservations/:id/paid - Marquer comme payée
router.post('/:id/paid', verifyToken, requireRole(orgRoles), reservationController.markAsPaid);

// PATCH /api/reservations/batch/invoice-status - Mise à jour en masse
router.patch('/batch/invoice-status', verifyToken, requireRole(orgRoles), reservationController.updateInvoiceStatusBatch);


// POST /api/reservations/:id/recalculate - Recalculer le prix
router.post('/:id/recalculate', verifyToken, requireRole(orgRoles), reservationController.recalculatePrice);

// ============================================
// Phase logistique - Gestion des jeux
// ============================================

// POST /api/reservations/:id/request-game-list
router.post('/:id/request-game-list', verifyToken, requireRole(orgRoles), reservationController.requestGameList);

// POST /api/reservations/:id/game-list-received
router.post('/:id/game-list-received', verifyToken, requireRole(orgRoles), reservationController.markGameListReceived);

// POST /api/reservations/:id/games - Ajouter des jeux à la réservation
router.post('/:id/games', verifyToken, requireRole(orgRoles), reservationController.addGames);

// DELETE /api/reservations/game/:gameId - Supprimer un jeu de la réservation
router.delete('/game/:gameId', verifyToken, requireRole(orgRoles), reservationController.removeGame);

// POST /api/reservations/:id/games-received - Marquer tous les jeux comme reçus
router.post('/:id/games-received', verifyToken, requireRole(orgRoles), reservationController.markGamesReceived);

// POST /api/reservations/game/:gameId/received - Pointage individuel d'un jeu
router.post('/game/:gameId/received', verifyToken, requireRole(orgRoles), reservationController.markGameAsReceived);

// ============================================
// Phase technique - Placement
// ============================================

// POST /api/reservations/game/:gameId/place - Placer un jeu dans une zone
router.post('/game/:gameId/place', verifyToken, requireRole(orgRoles), reservationController.placeGame);

// DELETE /api/reservations/game/:gameId/place - Retirer le placement
router.delete('/game/:gameId/place', verifyToken, requireRole(orgRoles), reservationController.unplaceGame);

// ============================================
// Historique des contacts
// ============================================

// GET /api/reservations/:id/contact-logs
router.get('/:id/contact-logs', verifyToken, requireRole(orgRoles), reservationController.getContactLogs);

// POST /api/reservations/:id/contact-log
router.post('/:id/contact-log', verifyToken, requireRole(orgRoles), reservationController.addContactLog);

export default router;
