import prisma from '../config/prisma.js';
import { ReservantType } from '@prisma/client';

export const createReservant = async (data: any) => {
  const { name, type, is_partner } = data;

  const newReservant = await prisma.reservant.create({
    data: {
      name,
      type: type || 'PUBLISHER',
      is_partner: Boolean(is_partner)
    },
  });

  return newReservant;
};

export const getAllReservants = async () => {
  return prisma.reservant.findMany({
    include: {
      reservations: {
        select: {
          reservation_id: true,
          status: true,
          invoice_status: true,
          festival: { select: { name: true } }
        }
      }
    }
  });
};

export const getReservantById = async (id: number) => {
  return prisma.reservant.findUnique({
    where: { reservant_id: id },
    include: {
      reservations: {
        include: {
          festival: true,
          zones: { include: { priceZone: true } },
          games: { include: { game: true } }
        }
      }
    }
  });
};

export const updateReservant = async (id: number, data: any) => {
  const { name, type, is_partner } = data;
  const updateData: Record<string, any> = {};

  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (is_partner !== undefined) updateData.is_partner = Boolean(is_partner);

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

// Obtenir les partenaires (boutiques, associations)
export const getPartners = async () => {
  return prisma.reservant.findMany({
    where: { is_partner: true },
    include: {
      reservations: {
        select: {
          reservation_id: true,
          status: true,
          festival: { select: { name: true } }
        }
      }
    }
  });
};

export default {
  createReservant,
  getAllReservants,
  getReservantById,
  updateReservant,
  deleteReservant,
  getPartners
};
