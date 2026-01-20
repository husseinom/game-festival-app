import { FestivalGame } from './festival-game';

export interface MapZone {
  id: number;
  festival_id: number;
  price_zone_id: number;
  name: string;
  small_tables: number;
  large_tables: number;
  city_tables: number;
  festivalGames?: FestivalGame[];
}
