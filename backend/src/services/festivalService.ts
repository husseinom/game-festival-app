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

export const updateFestival = async (id: number, festivalData: any) => {
  const { name, logo, location, total_tables, startDate, endDate } = festivalData;

  const existingFestival = await prisma.festival.findUnique({
    where: { id },
  });

  if (!existingFestival) {
    throw new Error('Festival not found');
  }

  const data: any = { ...festivalData };
  if (startDate) data.startDate = new Date(startDate);
  if (endDate) data.endDate = new Date(endDate);

  // Check for conflict if unique fields are updated
  if (name || location || startDate) {
      const newName = name || existingFestival.name;
      const newLocation = location || existingFestival.location;
      const newStartDate = startDate ? new Date(startDate) : existingFestival.startDate;

      const conflict = await prisma.festival.findUnique({
          where: {
              name_location_startDate: {
                  name: newName,
                  location: newLocation,
                  startDate: newStartDate
              }
          }
      });

      if (conflict && conflict.id !== id) {
          throw new Error('This festival already exists at this location and date.');
      }
  }

  const updatedFestival = await prisma.festival.update({
    where: { id },
    data,
  });

  return updatedFestival;
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