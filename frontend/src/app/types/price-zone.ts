import { MapZone } from "./map-zone";

export interface PriceZoneType{
  id: number;
  key: string;
  name: string;
}
export interface PriceZone {
    id: number,
    name: PriceZoneType,
    festival_id: number,
    small_tables: number;
    large_tables: number;
    city_tables: number;
    table_price: number,
    total_tables: number | undefined
    mapZones: MapZone[] | undefined
}
