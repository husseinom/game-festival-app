import { Router } from 'express';
import * as userController from '../controllers/userController.js';

const router = Router();

// POST /api/users/register
router.post('/register', userController.register);

export default router;