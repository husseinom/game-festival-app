import { GameDto } from './game-dto';
import { GamePublisherDto } from './game-publisher-dto';
import { MapZone } from './map-zone';

export interface FestivalGame {
  id: number;
  reservation_id: number;
  game_id: number;
  map_zone_id: number | null;
  copy_count: number;
  allocated_tables: number;
  table_size?: string;
  game?: GameDto;
  mapZone?: MapZone;
  reservation?: {
    reservation_id: number;
    publisher?: GamePublisherDto;
  };
}