import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAccessToken } from '../middlewares/authMiddleware.js';

export const createUser = async (userData: any) => {
  const { name, email, password, role } = userData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Cet email est déjà utilisé.');
  }

  // password hashing
  const hashedPassword = await bcrypt.hash(password, 10);

  // create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'VISITOR',
    },
  });
  const token = createAccessToken({ id: newUser.id, role: newUser.role }) // création du token d'accès


  const { password: _, ...userWithoutPassword } = newUser;
  return {
    token,
    user: userWithoutPassword};
};

export const login = async (credentials: any) => {
  const { email, password } = credentials;

  // seek for the user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // create JWT token
  const token = createAccessToken({ id: user.id, role: user.role }) // création du token d'accès

  // return user data without password
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    token,
    user: userWithoutPassword
  };
};

// Update user role (Admin only)
export const updateUserRole = async (userId: number, newRole: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as any },
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

// Delete user (Admin only)
export const deleteUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: 'Utilisateur supprimé avec succès' };
};

// Create user by admin (with role)
export const createUserByAdmin = async (userData: any) => {
  const { name, email, password, role } = userData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Cet email est déjà utilisé.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'VISITOR',
    },
  });

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// Get user by ID
export const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};