import { Router } from 'express';
import * as festivalController from '../controllers/festivalController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

const router = Router();

// POST /api/festivals/add
router.post(
    '/add',
    verifyToken,
    // requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    festivalController.add
);

// PUT /api/festivals/:id
router.put(
    '/:id',
    verifyToken,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    festivalController.updateFestival
);

// DELETE /api/festivals/:id
router.delete(
    '/:id',
    verifyToken,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    festivalController.deleteFestival
);

// GET /api/festivals/all
router.get('/all', festivalController.getAllFestivals);

// GET /api/festivals/:id
router.get('/:id', festivalController.getFestivalById);

export default router;