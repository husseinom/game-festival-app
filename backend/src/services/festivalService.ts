import prisma from '../config/prisma.js';

const PRESET_MAP: Record<string, { name: string; table_price: number }[]> = {
  standard: [{ name: 'Standard', table_price: 20 }],
  vip: [{ name: 'VIP', table_price: 100 }],
  standard_vip: [
    { name: 'Standard', table_price: 20 },
    { name: 'VIP', table_price: 60 }
  ]
};

export const createFestival = async (festivalData: any) => {
  const { 
    name, 
    location, 
    startDate, 
    endDate, 
    priceZoneTypeId,
    small_tables = 0,
    large_tables = 0,
    city_tables = 0
  } = festivalData;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const existingFestival = await prisma.festival.findUnique({
    where: {
      name_location_startDate: { name, location, startDate: start }
    }
  });

  if (existingFestival) {
    throw new Error('This festival already exists at this location and date.');
  }

  return prisma.$transaction(async (tx) => {
    // Create festival without table fields
    const fest = await tx.festival.create({
      data: {
        name,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priceZoneTypeId: priceZoneTypeId ?? null
      }
    });

    // Create PriceZones with table allocations
    if (priceZoneTypeId) {
      const pzType = await tx.priceZoneType.findUnique({ 
        where: { id: Number(priceZoneTypeId) } 
      });
      
      if (!pzType) throw new Error('Selected price zone type not found');

      const zones = PRESET_MAP[pzType.key] ?? [];
      
      if (zones.length === 1) {
        // Single zone: assign all tables to it
        await tx.priceZone.create({
          data: {
            festival_id: fest.id,
            name: zones[0].name,
            table_price: zones[0].table_price,
            small_tables,
            large_tables,
            city_tables,
            total_tables: small_tables + large_tables + city_tables
          }
        });
      } else if (zones.length === 2) {
        // Two zones: distribute tables (default: all to Standard, 0 to VIP)
        const standardZone = zones.find(z => z.name === 'Standard');
        const vipZone = zones.find(z => z.name === 'VIP');

        if (standardZone) {
          await tx.priceZone.create({
            data: {
              festival_id: fest.id,
              name: standardZone.name,
              table_price: standardZone.table_price,
              small_tables,
              large_tables,
              city_tables,
              total_tables: small_tables + large_tables + city_tables
            }
          });
        }

        if (vipZone) {
          await tx.priceZone.create({
            data: {
              festival_id: fest.id,
              name: vipZone.name,
              table_price: vipZone.table_price,
              small_tables: 0,
              large_tables: 0,
              city_tables: 0,
              total_tables: 0
            }
          });
        }
      }
    }

    return fest;
  });
};

export const updateFestival = async (id: number, festivalData: any) => {
  const { name, location, startDate, endDate, priceZoneTypeId } = festivalData;

  const existingFestival = await prisma.festival.findUnique({
    where: { id },
  });

  if (!existingFestival) {
    throw new Error('Festival not found');
  }

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

  const result = await prisma.$transaction(async (tx) => {
    const updatedFestival = await tx.festival.update({
      where: { id },
      data,
    });

    const oldPzTypeId = existingFestival.priceZoneTypeId ?? null;
    const newPzTypeId = priceZoneTypeId ?? null;

    if (oldPzTypeId !== newPzTypeId) {
      if (newPzTypeId === null) {
        await tx.priceZone.deleteMany({ where: { festival_id: id } });
      } else {
        const pzType = await tx.priceZoneType.findUnique({ where: { id: Number(newPzTypeId) } });
        if (!pzType) throw new Error('Selected price zone type not found');

        const desired = PRESET_MAP[pzType.key] ?? [];
        const existingZones = await tx.priceZone.findMany({ where: { festival_id: id } });
        const existingNames = existingZones.map(z => z.name);

        const totalSmall = small_tables ?? updatedFestival.small_tables;
        const totalLarge = large_tables ?? updatedFestival.large_tables;
        const totalCity = city_tables ?? updatedFestival.city_tables;

        let remainingSmall = totalSmall;
        let remainingLarge = totalLarge;
        let remainingCity = totalCity;

        const toCreate = desired
          .map((d, index) => {
            if (existingNames.includes(d.name)) return null;
            
            const isLast = index === desired.length - 1;
            let distribution;
            
            if (isLast) {
              distribution = {
                small_tables: remainingSmall,
                large_tables: remainingLarge,
                city_tables: remainingCity
              };
            } else {
              distribution = distributeTables(
                totalSmall, 
                totalLarge, 
                totalCity, 
                d.ratio ?? 1,
                d.preferLargeTables ?? false
              );
              remainingSmall -= distribution.small_tables;
              remainingLarge -= distribution.large_tables;
              remainingCity -= distribution.city_tables;
            }

            const zoneTotalTables = distribution.small_tables + distribution.large_tables + distribution.city_tables;

            return {
              festival_id: id,
              name: d.name,
              table_price: d.table_price,
              small_tables: distribution.small_tables,
              large_tables: distribution.large_tables,
              city_tables: distribution.city_tables,
              total_tables: zoneTotalTables
            };
          })
          .filter(Boolean);

        if (toCreate.length) {
          await tx.priceZone.createMany({ data: toCreate });
        }

        // Reset remaining for update loop
        remainingSmall = totalSmall;
        remainingLarge = totalLarge;
        remainingCity = totalCity;

        for (let i = 0; i < desired.length; i++) {
          const d = desired[i];
          const isLast = i === desired.length - 1;
          
          let distribution;
          if (isLast) {
            distribution = {
              small_tables: remainingSmall,
              large_tables: remainingLarge,
              city_tables: remainingCity
            };
          } else {
            distribution = distributeTables(
              totalSmall, 
              totalLarge, 
              totalCity, 
              d.ratio ?? 1,
              d.preferLargeTables ?? false
            );
            remainingSmall -= distribution.small_tables;
            remainingLarge -= distribution.large_tables;
            remainingCity -= distribution.city_tables;
          }

          const zoneTotalTables = distribution.small_tables + distribution.large_tables + distribution.city_tables;

          await tx.priceZone.updateMany({
            where: { festival_id: id, name: d.name },
            data: { 
              table_price: d.table_price,
              small_tables: distribution.small_tables,
              large_tables: distribution.large_tables,
              city_tables: distribution.city_tables,
              total_tables: zoneTotalTables
            }
          });
        }

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