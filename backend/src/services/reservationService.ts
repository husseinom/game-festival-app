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
    tables
  } = data;

  const reservation = await prisma.reservation.create({
    data: {
      game_publisher_id,
      festival_id,
      reservant_id,
      status: status || 'Contact pris',
      comments,
      is_publisher_presenting,
      game_list_requested,
      game_list_received,
      games_received,
      discount_amount,
      discount_tables,
      final_invoice_amount,
      zones: {
        create: tables && Array.isArray(tables) 
          ? tables.map((t: any) => ({
              price_zone_id: t.price_zone_id,
              table_count: t.table_count
            })) 
          : []
      }
    },
    include: {
      zones: { include: { priceZone: true } }
    }
  });

  return reservation;
};

export const getAllReservations = async () => {
  return prisma.reservation.findMany({
    include: {
      publisher: true,
      festival: true,
      reservant: true,
      zones: { include: { priceZone: true } },
    },
  });
};

export const getReservationById = async (id: number) => {
  return prisma.reservation.findUnique({
    where: { reservation_id: id },
    include: { 
      publisher: true, 
      festival: true, 
      reservant: true,
      zones: { include: { priceZone: true } }
    },
  });
};

export const updateReservation = async (id: number, data: any) => {
  return prisma.reservation.update({
    where: { reservation_id: id },
    data,
    include: { zones: true }
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