import { PriceZone, PriceZoneType } from "./price-zone";

// Legacy format (matches current database)
export interface Festival {
    id: number;
    name: string;
    location: string;
    small_tables: number;
    large_tables: number;
    city_tables: number;    
    startDate: Date;
    endDate: Date;
    priceZoneTypeId?: number;

    // optional populated relations returned by API
    priceZoneType?: PriceZoneType;
    priceZones?: PriceZone[];
}

// New format using TableType structure
export interface FestivalWithTableTypes {
    id: number;
    name: string;
    location: string;
    startDate: Date;
    endDate: Date;
    priceZoneTypeId?: number;
    
    tableAllocations: {
        STANDARD: number;
        LARGE: number;
        CITY: number;
    };

    priceZoneType?: PriceZoneType;
    priceZones?: PriceZone[];
}

// Conversion utilities
export class FestivalConverter {
    static toLegacy(modern: FestivalWithTableTypes): Festival {
        return {
            id: modern.id,
            name: modern.name,
            location: modern.location,
            small_tables: modern.tableAllocations.STANDARD,
            large_tables: modern.tableAllocations.LARGE,
            city_tables: modern.tableAllocations.CITY,
            startDate: modern.startDate,
            endDate: modern.endDate,
            priceZoneTypeId: modern.priceZoneTypeId,
            priceZoneType: modern.priceZoneType,
            priceZones: modern.priceZones
        };
    }

    static toModern(legacy: Festival): FestivalWithTableTypes {
        return {
            id: legacy.id,
            name: legacy.name,
            location: legacy.location,
            startDate: legacy.startDate,
            endDate: legacy.endDate,
            priceZoneTypeId: legacy.priceZoneTypeId,
            tableAllocations: {
                STANDARD: legacy.small_tables,
                LARGE: legacy.large_tables,
                CITY: legacy.city_tables
            },
            priceZoneType: legacy.priceZoneType,
            priceZones: legacy.priceZones
        };
    }
}
