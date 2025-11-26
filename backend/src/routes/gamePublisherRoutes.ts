import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as gamePublisherController from '../controllers/gamePublisherController.js';

const router = Router();

// POST /api/game_publishers/add
router.post(
    '/add',
    authMiddleware,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    gamePublisherController.add
);

// GET /api/game_publishers/all
router.get('/all', gamePublisherController.getAllGamePublishers);

// GET /api/game_publishers/:id
router.get('/:id', gamePublisherController.getGamePublisherById);

export default router;