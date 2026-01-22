import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

const router = Router();

// POST /api/users/register
router.post('/register', userController.register);

// POST /api/users/login
router.post('/login', userController.login);

// POST /api/users/refresh
router.post('/refresh', userController.refresh);

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

// GET /api/users/admin/:id - Get user by ID
router.get(
  '/admin/:id',
  verifyToken,
  requireRole(['ADMIN']),
  userController.getUserById
);

// POST /api/users/admin/create - Create user (Admin only)
router.post(
  '/admin/create',
  verifyToken,
  requireRole(['ADMIN']),
  userController.createUserByAdmin
);

// PUT /api/users/admin/:id/role - Update user role (Admin only)
router.put(
  '/admin/:id/role',
  verifyToken,
  requireRole(['ADMIN']),
  userController.updateUserRole
);

// DELETE /api/users/admin/:id - Delete user (Admin only)
router.delete(
  '/admin/:id',
  verifyToken,
  requireRole(['ADMIN']),
  userController.deleteUser
);

export default router;