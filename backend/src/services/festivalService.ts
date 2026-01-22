import prisma from '../config/prisma.js';
import { TableConverter } from '../utils/tableConverter.js';
import { TableSize } from '@prisma/client';

const PRESET_MAP: Record<string, { name: string; table_price: number; ratio?: number }[]> = {
  standard: [{ name: 'Standard', table_price: 20 }],
  vip: [{ name: 'VIP', table_price: 100 }],
  standard_vip: [
    { name: 'Standard', table_price: 20, ratio: 0.8 },
    { name: 'VIP', table_price: 60, ratio: 0.2 }
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
    // Create festival
    const fest = await tx.festival.create({
      data: {
        name,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priceZoneTypeId: priceZoneTypeId ?? null
      }
    });

    // Create PriceZones with TableTypes
    if (priceZoneTypeId) {
      const pzType = await tx.priceZoneType.findUnique({ 
        where: { id: Number(priceZoneTypeId) } 
      });
      
      if (!pzType) throw new Error('Selected price zone type not found');

      const zones = PRESET_MAP[pzType.key] ?? [];
      const totalTables = small_tables + large_tables + city_tables;

      let remainingSmall = small_tables;
      let remainingLarge = large_tables;
      let remainingCity = city_tables;
      
      for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        const isLast = i === zones.length - 1;
        
        // Calculate table distribution for this zone
        let distribution;
        if (isLast) {
          distribution = {
            small_tables: remainingSmall,
            large_tables: remainingLarge,
            city_tables: remainingCity
          };
        } else {
          const ratio = zone.ratio ?? 1;
          distribution = {
            small_tables: Math.floor(small_tables * ratio),
            large_tables: Math.floor(large_tables * ratio),
            city_tables: Math.floor(city_tables * ratio)
          };
          remainingSmall -= distribution.small_tables;
          remainingLarge -= distribution.large_tables;
          remainingCity -= distribution.city_tables;
        }

        const priceZone = await tx.priceZone.create({
          data: {
            festival_id: fest.id,
            name: zone.name,
            table_price: zone.table_price
          }
        });

        // Create TableTypes directly on PriceZone
        await TableConverter.createTableTypesFromLegacy(tx, priceZone.id, distribution);
      }
    }

    return fest;
  });
};

export const updateFestival = async (id: number, festivalData: any) => {
  const { 
    name, 
    location, 
    startDate, 
    endDate, 
    priceZoneTypeId,
    small_tables,
    large_tables,
    city_tables
  } = festivalData;

  const existingFestival = await prisma.festival.findUnique({
    where: { id },
  });

  if (!existingFestival) {
    throw new Error('Festival not found');
  }

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (location !== undefined) data.location = location;
  if (startDate) data.startDate = new Date(startDate);
  if (endDate) data.endDate = new Date(endDate);
  if (priceZoneTypeId !== undefined) data.priceZoneTypeId = priceZoneTypeId;

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

    // Handle price zone type changes
    if (oldPzTypeId !== newPzTypeId) {
      if (newPzTypeId === null) {
        // Delete TableTypes (cascaded) and PriceZones
        await tx.priceZone.deleteMany({ where: { festival_id: id } });
      } else {
        const pzType = await tx.priceZoneType.findUnique({ where: { id: Number(newPzTypeId) } });
        if (!pzType) throw new Error('Selected price zone type not found');

        const desired = PRESET_MAP[pzType.key] ?? [];
        const existingZones = await tx.priceZone.findMany({ 
          where: { festival_id: id },
          include: { tableTypes: true }
        });
        const existingNames = existingZones.map(z => z.name);

        // Get current totals or use provided values
        const currentTotals = await TableConverter.calculateFestivalTotals(tx, id);
        const totalSmall = small_tables ?? currentTotals.small_tables;
        const totalLarge = large_tables ?? currentTotals.large_tables;
        const totalCity = city_tables ?? currentTotals.city_tables;

        let remainingSmall = totalSmall;
        let remainingLarge = totalLarge;
        let remainingCity = totalCity;

        // Delete old zones that are not in desired
        const desiredNames = desired.map(d => d.name);
        const toDeleteNames = existingNames.filter(n => !desiredNames.includes(n));
        if (toDeleteNames.length) {
          await tx.priceZone.deleteMany({
            where: { festival_id: id, name: { in: toDeleteNames } }
          });
        }

        // Create or update zones
        for (let i = 0; i < desired.length; i++) {
          const d = desired[i];
          const isLast = i === desired.length - 1;
          const existingZone = existingZones.find(z => z.name === d.name);
          
          let distribution;
          if (isLast) {
            distribution = {
              small_tables: remainingSmall,
              large_tables: remainingLarge,
              city_tables: remainingCity
            };
          } else {
            const ratio = d.ratio ?? 1;
            distribution = {
              small_tables: Math.floor(totalSmall * ratio),
              large_tables: Math.floor(totalLarge * ratio),
              city_tables: Math.floor(totalCity * ratio)
            };
            remainingSmall -= distribution.small_tables;
            remainingLarge -= distribution.large_tables;
            remainingCity -= distribution.city_tables;
          }

          if (existingZone) {
            // Update existing zone
            await tx.priceZone.update({
              where: { id: existingZone.id },
              data: { table_price: d.table_price }
            });

            // Update TableTypes directly on PriceZone
            for (const [tableSizeName, count] of Object.entries({
              STANDARD: distribution.small_tables,
              LARGE: distribution.large_tables,
              CITY: distribution.city_tables
            })) {
              const existing = existingZone.tableTypes.find(tt => tt.name === tableSizeName);
              
              if (existing) {
                if (count > 0) {
                  await tx.tableType.update({
                    where: { id: existing.id },
                    data: { 
                      nb_total: count,
                      nb_available: count
                    }
                  });
                } else {
                  // Delete if count is 0
                  await tx.tableType.delete({ where: { id: existing.id } });
                }
              } else if (count > 0) {
                // Create new TableType if it doesn't exist
                const playerCount = tableSizeName === 'STANDARD' ? 4 : tableSizeName === 'LARGE' ? 6 : 8;
                await tx.tableType.create({
                  data: {
                    price_zone_id: existingZone.id,
                    name: tableSizeName as TableSize,
                    nb_total: count,
                    nb_available: count,
                    nb_total_player: playerCount
                  }
                });
              }
            }
          } else {
            // Create new zone
            const priceZone = await tx.priceZone.create({
              data: {
                festival_id: id,
                name: d.name,
                table_price: d.table_price
              }
            });

            await TableConverter.createTableTypesFromLegacy(tx, priceZone.id, distribution);
          }
        }
      }
    } else if (small_tables !== undefined || large_tables !== undefined || city_tables !== undefined) {
      // Update table counts without changing zone type
      const currentTotals = await TableConverter.calculateFestivalTotals(tx, id);
      const totalSmall = small_tables ?? currentTotals.small_tables;
      const totalLarge = large_tables ?? currentTotals.large_tables;
      const totalCity = city_tables ?? currentTotals.city_tables;

      const zones = await tx.priceZone.findMany({
        where: { festival_id: id },
        include: { tableTypes: true }
      });

      if (zones.length > 0) {
        const pzType = await tx.priceZoneType.findUnique({ 
          where: { id: updatedFestival.priceZoneTypeId! } 
        });
        
        if (pzType) {
          const desired = PRESET_MAP[pzType.key] ?? [];
          let remainingSmall = totalSmall;
          let remainingLarge = totalLarge;
          let remainingCity = totalCity;

          for (let i = 0; i < zones.length; i++) {
            const zone = zones[i];
            const zoneConfig = desired.find(d => d.name === zone.name);
            const isLast = i === zones.length - 1;
            
            let distribution;
            if (isLast) {
              distribution = {
                small_tables: remainingSmall,
                large_tables: remainingLarge,
                city_tables: remainingCity
              };
            } else {
              const ratio = zoneConfig?.ratio ?? 1;
              distribution = {
                small_tables: Math.floor(totalSmall * ratio),
                large_tables: Math.floor(totalLarge * ratio),
                city_tables: Math.floor(totalCity * ratio)
              };
              remainingSmall -= distribution.small_tables;
              remainingLarge -= distribution.large_tables;
              remainingCity -= distribution.city_tables;
            }

            // Update TableTypes directly on PriceZone
            for (const [tableSizeName, count] of Object.entries({
              STANDARD: distribution.small_tables,
              LARGE: distribution.large_tables,
              CITY: distribution.city_tables
            })) {
              const existing = zone.tableTypes.find(tt => tt.name === tableSizeName);
              
              if (existing) {
                if (count > 0) {
                  await tx.tableType.update({
                    where: { id: existing.id },
                    data: { 
                      nb_total: count,
                      nb_available: count
                    }
                  });
                } else {
                  await tx.tableType.delete({ where: { id: existing.id } });
                }
              } else if (count > 0) {
                const playerCount = tableSizeName === 'STANDARD' ? 4 : tableSizeName === 'LARGE' ? 6 : 8;
                await tx.tableType.create({
                  data: {
                    price_zone_id: zone.id,
                    name: tableSizeName as TableSize,
                    nb_total: count,
                    nb_available: count,
                    nb_total_player: playerCount
                  }
                });
              }
            }
          }
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