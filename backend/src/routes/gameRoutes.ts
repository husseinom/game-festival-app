import { Router, type NextFunction, type Request, type Response } from 'express';
import { verifyToken, type AuthRequest } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as gameController from '../controllers/gameController.js';

const router = Router();

// GET /api/games/types - Liste des types de jeux
router.get('/types', gameController.getAllGameTypes);

// POST /api/games/add
router.post(
    '/add',
    verifyToken,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR', 'ORGANISATOR']),
    gameController.add
);

// GET /api/games/all
router.get('/all', gameController.getAllGames);

// GET /api/games/:id
router.get('/:id', gameController.getGameById); 

// PUT /api/games/:id
router.put(
    '/:id',
    verifyToken,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR', 'ORGANISATOR']),
    gameController.updateGame
);

// DELETE /api/games/:id
router.delete(
    '/:id',
    verifyToken,
    requireRole(['ADMIN', 'SUPER_ORGANISATOR', 'ORGANISATOR']),
    gameController.deleteGame
);


export default router;