import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// interface Token décodé
interface DecodedToken {
  userId: number;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Récupérer le header "Authorization: Bearer <token>"
  const token = req.cookies.authToken;

  if (!token) {
    res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    return; // Important de return pour arrêter l'exécution
  }

  try {
    // 2. Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;

    // 3. Ajouter les infos user à la requête
    // On cast req en "AuthRequest" pour dire à TS que c'est bon
    (req as AuthRequest).user = { id: decoded.userId, role: decoded.role };

    // 4. Passer au suivant (le contrôleur)
    next();
    
  } catch (error) {
    res.status(403).json({ error: 'Token invalide ou expiré.' });
    return;
  }
};