import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// POST /api/users/register
router.post('/register', userController.register);

// POST /api/users/login
router.post('/login', userController.login);

// GET /api/users/me
router.get('/me', authMiddleware, userController.getProfile);

export default router;