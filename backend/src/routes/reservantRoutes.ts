import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as reservantController from '../controllers/reservantController.js';

const router = Router();

// POST /api/reservants/add
router.post(
  '/add',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
  reservantController.add
);

// GET /api/reservants/all
router.get('/all', reservantController.getAll);

// GET /api/reservants/:id
router.get('/:id', reservantController.getById);

// DELETE /api/reservants/:id
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
  reservantController.remove
);

export default router;
