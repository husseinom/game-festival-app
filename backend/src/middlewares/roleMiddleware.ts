import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './authMiddleware.js';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {

    // Check if user info is present
    if (!req.user) {
      res.status(401).json({ error: 'Utilisateur non authentifié' });
      return;
    }

    // Check if user role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Accès interdit : droits insuffisants.' });
      return;
    }

    // if all checks pass, it's ok
    next();
  };
};