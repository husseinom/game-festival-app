import prisma from '../config/prisma.js';

const PRESET_MAP: Record<string, { 
  name: string; 
  table_price: number; 
  ratio?: number;
  preferLargeTables?: boolean; // VIP zones prefer large tables
}[]> = {
  standard: [{ name: 'Standard', table_price: 20, ratio: 1 }],
  vip: [{ name: 'VIP', table_price: 100, ratio: 1, preferLargeTables: true }],
  standard_vip: [
    { name: 'Standard', table_price: 20, ratio: 0.7 }, // 70% of tables, more small/city
    { name: 'VIP', table_price: 60, ratio: 0.3, preferLargeTables: true } // 30% but prioritize large tables
  ]
};

// Helper function to distribute tables based on ratio and preference
function distributeTables(
  totalSmall: number,
  totalLarge: number,
  totalCity: number,
  ratio: number,
  preferLargeTables: boolean = false
) {
  if (preferLargeTables) {
    // VIP zone: prioritize large tables, then city, then small
    const largeForVip = Math.floor(totalLarge * ratio * 1.5); // Take more large tables
    const actualLarge = Math.min(largeForVip, totalLarge); // Can't exceed available
    
    const remainingRatio = (ratio * (totalSmall + totalLarge + totalCity) - actualLarge) / (totalSmall + totalCity);
    
    return {
      small_tables: Math.floor(totalSmall * remainingRatio * 0.3), // VIP gets fewer small tables
      large_tables: actualLarge,
      city_tables: Math.floor(totalCity * remainingRatio * 0.7) // Moderate city tables
    };
  } else {
    // Standard zone: balanced distribution
    return {
      small_tables: Math.floor(totalSmall * ratio),
      large_tables: Math.floor(totalLarge * ratio),
      city_tables: Math.floor(totalCity * ratio)
    };
  }
}

export const createFestival = async (festivalData: any) => {
  const { name, location, small_tables, large_tables, city_tables, startDate, endDate, priceZoneTypeId } = festivalData;

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
        small_tables: small_tables ?? 0,
        large_tables: large_tables ?? 0,
        city_tables: city_tables ?? 0,
        priceZoneTypeId: priceZoneTypeId ?? null
      }
    });

    if (priceZoneTypeId) {
      // ensure the selected type exists and read its key
      const pzType = await tx.priceZoneType.findUnique({ where: { id: Number(priceZoneTypeId) } });
      if (!pzType) throw new Error('Selected price zone type not found');

      const zones = PRESET_MAP[pzType.key] ?? [];
      if (zones.length) {
        const totalSmall = small_tables ?? 0;
        const totalLarge = large_tables ?? 0;
        const totalCity = city_tables ?? 0;

        let remainingSmall = totalSmall;
        let remainingLarge = totalLarge;
        let remainingCity = totalCity;

        const createData = zones.map((z, index) => {
          const isLast = index === zones.length - 1;
          
          let distribution;
          if (isLast) {
            // Last zone gets all remaining tables to avoid rounding errors
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
              z.ratio ?? 1,
              z.preferLargeTables ?? false
            );
            remainingSmall -= distribution.small_tables;
            remainingLarge -= distribution.large_tables;
            remainingCity -= distribution.city_tables;
          }

          const zoneTotalTables = distribution.small_tables + distribution.large_tables + distribution.city_tables;

          return {
            festival_id: fest.id,
            name: z.name,
            table_price: z.table_price,
            small_tables: distribution.small_tables,
            large_tables: distribution.large_tables,
            city_tables: distribution.city_tables,
            total_tables: zoneTotalTables
          };
        });
        
        await tx.priceZone.createMany({ data: createData });
      }
    }

    return fest;
  });
};

export const updateFestival = async (id: number, festivalData: any) => {
  const { name, location, small_tables, large_tables, city_tables, startDate, endDate, priceZoneTypeId } = festivalData;

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