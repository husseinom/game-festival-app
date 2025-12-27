import prisma from '../config/prisma.js';

const PRESET_MAP: Record<string, { name: string; table_price: number; total_tables?: number }[]> = {
  standard: [{ name: 'Standard', table_price: 20}],
  vip: [{ name: 'VIP', table_price: 100}],
  standard_vip: [
    { name: 'Standard', table_price: 20},
    { name: 'VIP', table_price: 60}
  ]
};

export const createFestival = async (festivalData: any) => {
  const { name, location, total_tables, startDate, endDate, priceZoneTypeId } = festivalData;

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
  return prisma.$transaction(async (tx) => {
    const fest = await tx.festival.create({
      data: {
        name,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        total_tables: total_tables ?? 0,
        priceZoneTypeId: priceZoneTypeId ?? null
      }
    });

    if (priceZoneTypeId) {
      // ensure the selected type exists and read its key
      const pzType = await tx.priceZoneType.findUnique({ where: { id: Number(priceZoneTypeId) } });
      if (!pzType) throw new Error('Selected price zone type not found');

      const zones = PRESET_MAP[pzType.key] ?? [];
      if (zones.length) {
        const createData = zones.map(z => ({
          festival_id: fest.id,
          name: z.name,
          table_price: z.table_price,
          total_tables: z.total_tables ?? null
        }));
        await tx.priceZone.createMany({ data: createData });
      }
    }

    // return the created festival (you can include created priceZones if you prefer)
    return fest;
  });
};

export const updateFestival = async (id: number, festivalData: any) => {
  const { name, location, total_tables, startDate, endDate } = festivalData;

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