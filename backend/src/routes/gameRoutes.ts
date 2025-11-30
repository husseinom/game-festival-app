import { Router, type NextFunction, type Request, type Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as gameController from '../controllers/gameController.js';

const router = Router();


// POST /api/games/add
router.post(
    '/add',
    // authMiddleware,
    // requireRole(['ADMIN', 'SUPER_ORGANISATOR', 'ORGANISATOR']),
    gameController.add
);

// GET /api/games/all
router.get('/all', gameController.getAllGames);

// GET /api/games/:id
router.get('/:id', gameController.getGameById); 

// PUT /api/games/:id
router.put(
    '/:id',
    // authMiddleware,
    // requireRole(['ADMIN', 'SUPER_ORGANISATOR', 'ORGANISATOR']),
    gameController.updateGame
);

// DELETE /api/games/:id
router.delete(
    '/:id',
    // authMiddleware,
    // requireRole(['ADMIN', 'SUPER_ORGANISATOR', 'ORGANISATOR']),
    gameController.deleteGame
);


export default router;