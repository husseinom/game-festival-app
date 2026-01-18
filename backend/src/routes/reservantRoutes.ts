import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as reservantController from '../controllers/reservantController.js';
import { verify } from 'crypto';

const router = Router();

// POST /api/reservants/add
router.post(
  '/add',
  verifyToken,
  requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
  reservantController.add
);

// GET /api/reservants/all
router.get('/all', reservantController.getAll);

// GET /api/reservants/:id
router.get('/:id', reservantController.getById);

// PATCH /api/reservants/:id
router.patch(
  '/:id',
  verifyToken,
  requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
  reservantController.update
);

// DELETE /api/reservants/:id
router.delete(
  '/:id',
  verifyToken,
  requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
  reservantController.remove
);

export default router;
