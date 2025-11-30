import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as gamePublisherController from '../controllers/gamePublisherController.js';

const router = Router();

// POST /api/game_publishers/add
router.post(
    '/add',
    // authMiddleware,
    // requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    gamePublisherController.add
);

// GET /api/game_publishers/all
router.get('/all', gamePublisherController.getAllGamePublishers);

// GET /api/game_publishers/:id
router.get('/:id', gamePublisherController.getGamePublisherById);

// PUT /api/game_publishers/:id
router.put(
    '/:id',
    // authMiddleware,
    // requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    gamePublisherController.updateGamePublisher
);

// DELETE /api/game_publishers/:id
router.delete(
    '/:id',
    // authMiddleware,
    // requireRole(['ADMIN', 'SUPER_ORGANISATOR']),
    gamePublisherController.deleteGamePublisher
);

// GET /api/game_publishers/:id/games
router.get('/:id/games', gamePublisherController.getGamesByPublisherId);

// POST /api/game_publishers/:id/games
router.post(
    '/:id/games',
    // authMiddleware,
    // requireRole(['ADMIN', 'SUPER_ORGANISATOR', 'ORGANISATOR']),
    gamePublisherController.addGameToPublisher
);

export default router;