import type { Request, Response } from 'express';
import * as userService from '../services/userService.js';
import type { AuthRequest } from '../middlewares/authMiddleware.js';
import jwt from 'jsonwebtoken';
import { createAccessToken, createRefreshToken } from '../middlewares/authMiddleware.js';
import prisma from '../config/prisma.js';

export const register = async (req: Request, res: Response) => {
  try {
    // Appel au service
    const result = await userService.createUser(req.body);

    const refreshToken = createRefreshToken({id: result.user.id, role: result.user.role})
    
    res.cookie('access_token', result.token, {
      httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Réponse succès 201 (Created)
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: result.user
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

  if (!userId) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }

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

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token manquant' });
    }
    
    // Verify refresh token and create new access token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
    const newAccessToken = createAccessToken({ id: decoded.id, role: decoded.role });
    
    // Set new access token cookie
    res.cookie('access_token', newAccessToken, {
      httpOnly: true, 
      secure: true, 
      sameSite: 'strict', 
      maxAge: 15 * 60 * 1000
    });
    
    res.status(200).json({ message: 'Token rafraîchi' });
  } catch (error) {
    res.status(401).json({ error: 'Refresh token invalide' });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ error: 'Le rôle est requis' });
      return;
    }

    const validRoles = ['ADMIN', 'VISITOR', 'VOLUNTEER', 'ORGANISATOR', 'SUPER_ORGANISATOR'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Rôle invalide' });
      return;
    }

    const updatedUser = await userService.updateUserRole(userId, role);
    res.status(200).json({ message: 'Rôle mis à jour', user: updatedUser });
  } catch (error: any) {
    if (error.message === 'Utilisateur non trouvé') {
      res.status(404).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const result = await userService.deleteUser(userId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Utilisateur non trouvé') {
      res.status(404).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  }
};

// Create user by admin (Admin only)
export const createUserByAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Nom, email et mot de passe sont requis' });
      return;
    }

    const newUser = await userService.createUserByAdmin({ name, email, password, role });
    res.status(201).json({ message: 'Utilisateur créé avec succès', user: newUser });
  } catch (error: any) {
    if (error.message === 'Cet email est déjà utilisé.') {
      res.status(409).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  }
};

// Get user by ID (Admin only)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await userService.getUserById(userId);
    res.status(200).json(user);
  } catch (error: any) {
    if (error.message === 'Utilisateur non trouvé') {
      res.status(404).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur interne' });
    }
  }
};