import { PriceZone, PriceZoneType } from "./price-zone";

export interface Festival {
    id: number,
    name: string,
    location: string,
    total_tables: number | undefined,
    startDate: Date,
    endDate: Date,
    priceZoneTypeId?: number;

    // optional populated relations returned by API
    priceZoneType?: PriceZoneType;
    priceZones?: PriceZone[];
}
