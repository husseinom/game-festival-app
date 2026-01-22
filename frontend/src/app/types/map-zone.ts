import { TableType } from "./table-type";
import { FestivalGame } from './festival-game';

export interface MapZone {
  id: number;
  festival_id: number;
  price_zone_id: number;
  name: string;
  
  // Legacy fields (still in database for now)
  small_tables?: number;
  large_tables?: number;
  city_tables?: number;
  
  // New system
  tableTypes?: TableType[];
  festivalGames?: FestivalGame[];
}
