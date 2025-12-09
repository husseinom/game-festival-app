import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

const router = Router();

// POST /api/users/register
router.post('/register', userController.register);

// POST /api/users/login
router.post('/login', userController.login);

// GET /api/users/me
router.get('/me', verifyToken, userController.getProfile);

// POST /api/users/logout
router.post('/logout', (_req, res) => {
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    res.json({ message: 'Déconnexion réussie' })
})

// GET /api/users/admin/all
router.get(
  '/admin/all', 
  verifyToken,
  requireRole(['ADMIN']),
  userController.getAllUsers
);

export default router;