import { GamePublisherDto } from "./game-publisher-dto";
import { Festival } from "./festival";
import { PriceZone } from "./price-zone";
import { Reservant } from "./reservant";

// ============================================
// CONSTANTES DE CONVERSION ESPACE / TABLES
// ============================================

// 1 unité de table = 4 m² (standard de référence)
export const M2_PER_TABLE_UNIT = 4;

// Équivalent en unités de table par type de table physique
export const TABLE_SIZE_UNITS: Record<string, number> = {
  'STANDARD': 1,   // Table standard = 1 unité = 4 m²
  'LARGE': 2,      // Grande table = 2 unités = 8 m²
  'CITY': 1        // Table mairie = variable (par défaut 1)
};

// Équivalent en unités de table par taille de jeu
export const GAME_SIZE_UNITS: Record<string, number> = {
  'SMALL': 0.5,    // Petit jeu = 0.5 unité = 2 m²
  'STANDARD': 1,   // Jeu standard = 1 unité = 4 m²
  'LARGE': 2       // Gros jeu = 2 unités = 8 m²
};

// Fonctions utilitaires de conversion
export function tablesToM2(tableUnits: number): number {
  return tableUnits * M2_PER_TABLE_UNIT;
}

export function m2ToTables(m2: number): number {
  return m2 / M2_PER_TABLE_UNIT;
}

export function getTableUnitsBySize(tableSize: TableSize): number {
  return TABLE_SIZE_UNITS[tableSize] ?? 1;
}

export function getGameUnits(gameSize: GameSize): number {
  return GAME_SIZE_UNITS[gameSize] ?? 1;
}

// ============================================
// ENUMS
// ============================================

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

export const GameSize = {
  SMALL: 'SMALL',
  STANDARD: 'STANDARD',
  LARGE: 'LARGE'
} as const;

export type GameSize = typeof GameSize[keyof typeof GameSize];

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
  'STANDARD': 'Standard (4 m²)',
  'LARGE': 'Grande (8 m²)',
  'CITY': 'Mairie'
};

export const GAME_SIZE_LABELS: Record<GameSize, string> = {
  'SMALL': 'Petit (2 m²)',
  'STANDARD': 'Standard (4 m²)',
  'LARGE': 'Grand (8 m²)'
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
    table_count: number;   // Unités de table (1 unité = 4 m²)
    space_m2?: number;     // Espace en m² (calculé automatiquement)
  }[];
}

export interface FestivalGame {
  id: number;
  game_id: number;
  map_zone_id?: number;
  copy_count: number;
  game_size: GameSize;           // Taille du jeu: SMALL, STANDARD, LARGE
  table_size: TableSize;         // Type de table physique
  allocated_tables: number;      // Unités de table occupées
  space_m2: number;              // Espace en m²
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
    table_count: number;   // Unités de table
    space_m2: number;      // Espace en m²
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