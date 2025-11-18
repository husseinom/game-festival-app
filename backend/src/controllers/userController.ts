import type { Request, Response } from 'express';
import * as userService from '../services/userService.js';

export const register = async (req: Request, res: Response) => {
  try {
    // Appel au service
    const user = await userService.createUser(req.body);
    
    // Réponse succès 201 (Created)
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      data: user
    });
  } catch (error: any) {
    // Gestion basique des erreurs
    if (error.message === 'Cet email est déjà utilisé.') {
      res.status(409).json({ error: error.message }); // 409 Conflict
    } else {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  }
};