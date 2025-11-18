import { Router } from 'express';
import * as userController from '../controllers/userController.js';

const router = Router();

// POST /api/users/register
router.post('/register', userController.register);

// POST /api/users/login
router.post('/login', userController.login);

export default router;