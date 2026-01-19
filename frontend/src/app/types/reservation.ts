import { GamePublisherDto } from "./game-publisher-dto";
import { Festival } from "./festival";
import { PriceZone } from "./price-zone";
import { Reservant } from "./reservant";

export interface CreateReservationDTO {
  game_publisher_id?: number;
  festival_id: number;
  reservant_id: number;
  status?: string;
  comments?: string;
  is_publisher_presenting: boolean;
  game_list_requested: boolean;
  game_list_received: boolean;
  games_received: boolean;
  discount_amount?: number;
  discount_tables?: number;
  nb_electrical_outlets: number;
  final_invoice_amount?: number;
  
  tables: {
    price_zone_id: number;
    table_count: number;
  }[];
}

export interface Reservation extends CreateReservationDTO {
  reservation_id: number;
  publisher?: GamePublisherDto;
  festival?: Festival;
  reservant?: Reservant;
  
  zones?: {
    id: number;
    table_count: number;
    priceZone: PriceZone;
  }[];
  
  games?: {
    id: number;
    game_id: number;
    map_zone_id?: number;
    copy_count: number;
    allocated_tables: number;
  }[];
  
  contactLogs?: {
    id: number;
    contact_date: string;
    notes?: string;
  }[];
}