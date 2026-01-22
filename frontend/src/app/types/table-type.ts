export type TableSize = 'STANDARD' | 'LARGE' | 'CITY';

export interface TableType {
  id: number;
  name: TableSize;
  nb_total: number;
  nb_available: number;
  nb_total_player: number;
  map_zone_id: number;
}