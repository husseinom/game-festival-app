import { PriceZone, PriceZoneType } from "./price-zone";

export interface Festival {
    id: number,
    name: string,
    location: string,
    small_tables: number;
    large_tables: number;
    city_tables: number;    
    startDate: Date,
    endDate: Date,
    priceZoneTypeId?: number;

    // optional populated relations returned by API
    priceZoneType?: PriceZoneType;
    priceZones?: PriceZone[];
}
