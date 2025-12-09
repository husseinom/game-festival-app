import type { Request, Response } from 'express';
import * as userService from '../services/userService.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import { createAccessToken, createRefreshToken } from '../middlewares/authMiddleware.js';
import prisma from '../config/prisma.js';

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

export const login = async (req: Request, res: Response) => {
  try {
    const result = await userService.login(req.body);

    const refreshToken = createRefreshToken({ id: result.user.id, role: result.user.role }) // création du refresh token
    res.cookie('access_token', result.token, { // --------------------------------- Cookies sécurisés pour le token d'accès
        httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000,
    })
    res.cookie('refresh_token', refreshToken, { // --------------------------------- Cookies sécurisés pour le refresh token
        httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    
    res.status(200).json({
      message: 'Connexion réussie',
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    if (error.message === 'Email ou mot de passe incorrect') {
      res.status(401).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  }
};


export const getProfile = async (req: Request, res: Response) => {
  // On utilise l'ID qui a été mis dans req.user par le middleware
  const userId = (req as AuthRequest).user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
       res.status(404).json({ error: 'Utilisateur introuvable' });
       return;
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({user:userWithoutPassword});

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
     }
    });
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};