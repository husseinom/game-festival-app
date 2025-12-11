import prisma from '../config/prisma.js';

export const createReservation = async (data: any) => {
  const {
    game_publisher_id,
    festival_id,
    reservant_id,
    status,
    comments,
    is_publisher_presenting,
    game_list_requested,
    game_list_received,
    games_received,
    discount_amount,
    discount_tables,
    final_invoice_amount,
  } = data;

  const reservation = await prisma.reservation.create({
    data: {
      game_publisher_id,
      festival_id,
      reservant_id,
      status,
      comments,
      is_publisher_presenting,
      game_list_requested,
      game_list_received,
      games_received,
      discount_amount,
      discount_tables,
      final_invoice_amount,
    },
  });

  return reservation;
};

export const getAllReservations = async () => {
  return prisma.reservation.findMany({
    include: {
      publisher: true,
      festival: true,
      reservant: true,
    },
  });
};

export const getReservationById = async (id: number) => {
  return prisma.reservation.findUnique({
    where: { reservation_id: id },
    include: { publisher: true, festival: true, reservant: true },
  });
};

export const updateReservation = async (id: number, data: any) => {
  return prisma.reservation.update({
    where: { reservation_id: id },
    data,
  });
};

export const deleteReservation = async (id: number) => {
  return prisma.reservation.delete({ where: { reservation_id: id } });
};

export default {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
};
