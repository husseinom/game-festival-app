import prisma from '../config/prisma.js';

export const createReservant = async (data: any) => {
  const { name, type } = data;

  const newReservant = await prisma.reservant.create({
    data: {
      name,
      type,
    },
  });

  return newReservant;
};

export const getAllReservants = async () => {
  return prisma.reservant.findMany();
};

export const getReservantById = async (id: number) => {
  return prisma.reservant.findUnique({ where: { reservant_id: id } });
};

export const updateReservant = async (id: number, data: any) => {
  const { type } = data;

  const updatedReservant = await prisma.reservant.update({
    where: { reservant_id: id },
    data: {
      type,
    },
  });

  return updatedReservant;
};

export const deleteReservant = async (id: number) => {
  return prisma.reservant.delete({ where: { reservant_id: id } });
};

export default {
  createReservant,
  getAllReservants,
  getReservantById,
  deleteReservant,
};
