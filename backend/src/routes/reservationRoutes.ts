import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as reservationController from '../controllers/reservationController.js';

const router = Router();

// POST /api/reservations/add
router.post(
  '/add',
  verifyToken,
  requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
  reservationController.add
);

// GET /api/reservations/all
router.get('/all', reservationController.getAll);

// GET /api/reservations/:id
router.get('/:id', reservationController.getById);

// PUT /api/reservations/:id
router.put(
  '/:id',
  verifyToken,
  requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
  reservationController.update
);

// DELETE /api/reservations/:id
router.delete(
  '/:id',
  verifyToken,
  requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
  reservationController.remove
);

export default router;
