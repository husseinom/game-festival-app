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
  const { name, type } = data;
  const updateData: Record<string, any> = {};

  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;

  if (Object.keys(updateData).length === 0) {
    throw new Error('No fields provided for update');
  }

  return prisma.reservant.update({
    where: { reservant_id: id },
    data: updateData,
  });
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
