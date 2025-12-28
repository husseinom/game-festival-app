import { GamePublisherDto } from "./game-publisher-dto";
import { Festival } from "./festival";
import { PriceZone } from "./price-zone";

export interface CreateReservationDTO {
  game_publisher_id: number;
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
  
  zones?: {
    id: number;
    table_count: number;
    priceZone: PriceZone;
  }[];
}