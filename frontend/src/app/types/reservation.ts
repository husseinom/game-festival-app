import { GamePublisherDto } from "./game-publisher-dto";
import { Festival } from "./festival";
import { PriceZone } from "./price-zone";
import { Reservant } from "./reservant";

// Enums correspondant au backend (utiliser les valeurs comme constantes)
export const ReservationStatus = {
  NOT_CONTACTED: 'NOT_CONTACTED',
  CONTACTED: 'CONTACTED',
  IN_DISCUSSION: 'IN_DISCUSSION',
  CONFIRMED: 'CONFIRMED',
  ABSENT: 'ABSENT',
  CONSIDERED_ABSENT: 'CONSIDERED_ABSENT'
} as const;

export type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];

export const InvoiceStatus = {
  PENDING: 'PENDING',
  INVOICED: 'INVOICED',
  PAID: 'PAID'
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const TableSize = {
  STANDARD: 'STANDARD',
  LARGE: 'LARGE',
  CITY: 'CITY'
} as const;

export type TableSize = typeof TableSize[keyof typeof TableSize];

// Labels pour l'affichage
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  'NOT_CONTACTED': 'Pas contacté',
  'CONTACTED': 'Contact pris',
  'IN_DISCUSSION': 'Discussion en cours',
  'CONFIRMED': 'Présent',
  'ABSENT': 'Absent',
  'CONSIDERED_ABSENT': 'Considéré absent'
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  'PENDING': 'En attente',
  'INVOICED': 'Facturée',
  'PAID': 'Payée'
};

export const TABLE_SIZE_LABELS: Record<TableSize, string> = {
  'STANDARD': 'Standard',
  'LARGE': 'Grande',
  'CITY': 'Mairie'
};

export interface CreateReservationDTO {
  game_publisher_id?: number;
  festival_id: number;
  reservant_id?: number;
  publisher_is_reservant?: boolean;
  status?: ReservationStatus;
  comments?: string;
  large_table_request?: string;
  is_publisher_presenting: boolean;
  needs_festival_animators?: boolean;
  discount_amount?: number;
  discount_tables?: number;
  nb_electrical_outlets: number;
  
  tables: {
    price_zone_id: number;
    table_count: number;
  }[];
}

export interface FestivalGame {
  id: number;
  game_id: number;
  map_zone_id?: number;
  copy_count: number;
  table_size: TableSize;
  allocated_tables: number;
  is_received: boolean;
  received_at?: string;
  game?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  mapZone?: {
    id: number;
    name: string;
  };
}

export interface ContactLog {
  id: number;
  contact_date: string;
  notes?: string;
}

export interface Reservation {
  reservation_id: number;
  game_publisher_id?: number;
  festival_id: number;
  reservant_id: number;
  
  // Workflow
  status: ReservationStatus;
  comments?: string;
  large_table_request?: string;
  
  // Facturation
  invoice_status: InvoiceStatus;
  invoiced_at?: string;
  paid_at?: string;
  discount_amount?: number;
  discount_tables?: number;
  nb_electrical_outlets: number;
  final_invoice_amount?: number;
  
  // Logistique
  is_publisher_presenting: boolean;
  needs_festival_animators: boolean;
  game_list_requested: boolean;
  game_list_requested_at?: string;
  game_list_received: boolean;
  game_list_received_at?: string;
  games_received: boolean;
  games_received_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  publisher?: GamePublisherDto;
  festival?: Festival;
  reservant?: Reservant;
  
  zones?: {
    id: number;
    table_count: number;
    priceZone: PriceZone;
  }[];
  
  games?: FestivalGame[];
  contactLogs?: ContactLog[];
}

export interface ReservationStats {
  totalReservations: number;
  byStatus: Record<string, number>;
  byInvoiceStatus: Record<string, number>;
  totalTables: number;
  totalElectricalOutlets: number;
  totalGames: number;
  totalRevenue: number;
  paidRevenue: number;
}