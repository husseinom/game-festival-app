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
  const { name, location, total_tables, startDate, endDate, priceZoneTypeId } = festivalData;

  const existingFestival = await prisma.festival.findUnique({
    where: { id },
  });

  if (!existingFestival) {
    throw new Error('Festival not found');
  }

  // preserve previous conflict check (unchanged)
  const data: any = { ...festivalData };
  if (startDate) data.startDate = new Date(startDate);
  if (endDate) data.endDate = new Date(endDate);

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

  // Use a transaction so festival update + priceZone reconciliation are atomic
  const result = await prisma.$transaction(async (tx) => {
    const updatedFestival = await tx.festival.update({
      where: { id },
      data,
    });

    // Reconcile price zones if the selected priceZoneType changed
    const oldPzTypeId = existingFestival.priceZoneTypeId ?? null;
    const newPzTypeId = priceZoneTypeId ?? null;

    if (oldPzTypeId !== newPzTypeId) {
      if (newPzTypeId === null) {
        // Remove all price zones when type is cleared
        await tx.priceZone.deleteMany({ where: { festival_id: id } });
      } else {
        const pzType = await tx.priceZoneType.findUnique({ where: { id: Number(newPzTypeId) } });
        if (!pzType) throw new Error('Selected price zone type not found');

        const desired = PRESET_MAP[pzType.key] ?? [];
        // current zones for this festival
        const existingZones = await tx.priceZone.findMany({ where: { festival_id: id } });
        const existingNames = existingZones.map(z => z.name);

        // create missing zones
        const toCreate = desired
          .filter(d => !existingNames.includes(d.name))
          .map(d => ({
            festival_id: id,
            name: d.name,
            table_price: d.table_price,
            total_tables: d.total_tables ?? null
          }));
        if (toCreate.length) {
          await tx.priceZone.createMany({ data: toCreate });
        }

        // update matching zones (table_price / total_tables)
        for (const d of desired) {
          await tx.priceZone.updateMany({
            where: { festival_id: id, name: d.name },
            data: { table_price: d.table_price, total_tables: d.total_tables ?? null }
          });
        }

        // delete extra zones that are not in desired preset
        const desiredNames = desired.map(d => d.name);
        const toDeleteNames = existingNames.filter(n => !desiredNames.includes(n));
        if (toDeleteNames.length) {
          await tx.priceZone.deleteMany({
            where: { festival_id: id, name: { in: toDeleteNames } }
          });
        }
      }
    }

    return updatedFestival;
  });

  return result;
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