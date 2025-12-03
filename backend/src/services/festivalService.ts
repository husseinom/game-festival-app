import prisma from '../config/prisma.js';

export const createFestival = async (festivalData: any) => {
  const { name, logo, location, total_tables, startDate, endDate } = festivalData;

  // date conversion
  const start = new Date(startDate);
  const end = new Date(endDate);

  const existingFestival = await prisma.festival.findUnique({
    where: {
      name_location_startDate: {
        name,
        location,
        startDate: start,
      },
    },
  });

  if (existingFestival) {
    throw new Error('This festival already exists at this location and date.');
  }

  // create new festival
  const newFestival = await prisma.festival.create({
    data: {
        name,
        logo,
        location,
        total_tables,
        startDate: start,
        endDate: end,
    },
  });

  return newFestival;
};

export const deleteFestival = async (id: number) => {
  const existingFestival = await prisma.festival.findUnique({
    where: { id },
  });

  if (!existingFestival) {
    throw new Error('Festival not found');
  }

  await prisma.festival.delete({
    where: { id },
  });

  return { message: 'Festival deleted successfully' };
};