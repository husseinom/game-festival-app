import { PrismaClient, TableSize } from '@prisma/client';

export interface TableAllocation {
    STANDARD: number;
    LARGE: number;
    CITY: number;
}

export class TableConverter {
    // Convert legacy fields to TableType format
    static legacyToTableTypes(data: {
        small_tables: number;
        large_tables: number;
        city_tables: number;
    }): TableAllocation {
        return {
            STANDARD: data.small_tables,
            LARGE: data.large_tables,
            CITY: data.city_tables
        };
    }

    // Convert TableType format to legacy fields
    static tableTypesToLegacy(allocations: TableAllocation): {
        small_tables: number;
        large_tables: number;
        city_tables: number;
    } {
        return {
            small_tables: allocations.STANDARD,
            large_tables: allocations.LARGE,
            city_tables: allocations.CITY
        };
    }

    // When creating MapZone, convert festival's legacy fields to TableType records
    static async createTableTypesFromLegacy(
        tx: any, // PrismaClient transaction
        mapZoneId: number,
        festivalData: { small_tables: number; large_tables: number; city_tables: number }
    ) {
        const tableTypes = [
            {
                map_zone_id: mapZoneId,
                name: TableSize.STANDARD,
                nb_total: festivalData.small_tables,
                nb_available: festivalData.small_tables,
                nb_total_player: 4
            },
            {
                map_zone_id: mapZoneId,
                name: TableSize.LARGE,
                nb_total: festivalData.large_tables,
                nb_available: festivalData.large_tables,
                nb_total_player: 6
            },
            {
                map_zone_id: mapZoneId,
                name: TableSize.CITY,
                nb_total: festivalData.city_tables,
                nb_available: festivalData.city_tables,
                nb_total_player: 8
            }
        ];

        // Only create entries for non-zero allocations
        for (const tt of tableTypes) {
            if (tt.nb_total > 0) {
                await tx.tableType.create({ data: tt });
            }
        }
    }

    // Calculate festival totals from all MapZone TableTypes
    static async calculateFestivalTotals(tx: any, festivalId: number): Promise<{
        small_tables: number;
        large_tables: number;
        city_tables: number;
    }> {
        const mapZones = await tx.mapZone.findMany({
            where: { festival_id: festivalId },
            include: { tableTypes: true }
        });

        let small_tables = 0;
        let large_tables = 0;
        let city_tables = 0;

        for (const zone of mapZones) {
            for (const tt of zone.tableTypes || []) {
                switch (tt.name) {
                    case TableSize.STANDARD:
                        small_tables += tt.nb_total;
                        break;
                    case TableSize.LARGE:
                        large_tables += tt.nb_total;
                        break;
                    case TableSize.CITY:
                        city_tables += tt.nb_total;
                        break;
                }
            }
        }

        return { small_tables, large_tables, city_tables };
    }

    // Calculate available tables for a specific MapZone
    static async getMapZoneAvailability(tx: any, mapZoneId: number): Promise<{
        small_available: number;
        large_available: number;
        city_available: number;
    }> {
        const tableTypes = await tx.tableType.findMany({
            where: { map_zone_id: mapZoneId }
        });

        let small_available = 0;
        let large_available = 0;
        let city_available = 0;

        for (const tt of tableTypes) {
            switch (tt.name) {
                case TableSize.STANDARD:
                    small_available = tt.nb_available;
                    break;
                case TableSize.LARGE:
                    large_available = tt.nb_available;
                    break;
                case TableSize.CITY:
                    city_available = tt.nb_available;
                    break;
            }
        }

        return { small_available, large_available, city_available };
    }
}