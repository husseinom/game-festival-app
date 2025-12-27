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
    table_price: number,
    total_table_nb: number | undefined
    mapZones: MapZone[] | undefined
}
