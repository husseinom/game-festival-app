import { Router } from 'express';
import * as festivalController from '../controllers/festivalController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

const router = Router();

// POST /api/festivals/add
router.post(
    '/add',
    authMiddleware,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    festivalController.add
);

// DELETE /api/festivals/:id
router.delete(
    '/:id',
    authMiddleware,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    festivalController.deleteFestival
);

// GET /api/festivals/all
router.get('/all', festivalController.getAllFestivals);

// GET /api/festivals/:id
router.get('/:id', festivalController.getFestivalById);

export default router;