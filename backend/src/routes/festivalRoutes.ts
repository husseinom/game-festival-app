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

// GET /api/festivals/:id
router.get('/:id', festivalController.getFestivalById);

// GET /api/festivals/all
router.get('/all', festivalController.getAllFestivals);

export default router;