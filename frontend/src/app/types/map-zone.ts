import { FestivalGame } from './festival-game';

export interface TableType {
  id: number;
  map_zone_id: number;
  name: 'STANDARD' | 'LARGE' | 'CITY';
  nb_total: number;
  nb_available: number;
  nb_total_player: number;
}

export interface MapZone {
  id: number;
  festival_id: number;
  price_zone_id: number;
  name: string;
  small_tables: number;
  large_tables: number;
  city_tables: number;
  festivalGames?: FestivalGame[];
  tableTypes?: TableType[];
  price_zone?: {
    id: number;
    name: string;
    description?: string;
  };
}
