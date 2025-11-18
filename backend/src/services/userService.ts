import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

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

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};