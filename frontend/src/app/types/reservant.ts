// Types de réservant
export const ReservantType = {
  PUBLISHER: 'PUBLISHER',
  PROVIDER: 'PROVIDER',
  SHOP: 'SHOP',
  ASSOCIATION: 'ASSOCIATION',
  ANIMATION: 'ANIMATION'
} as const;

export type ReservantType = typeof ReservantType[keyof typeof ReservantType];

// Labels pour l'affichage
export const RESERVANT_TYPE_LABELS: Record<ReservantType, string> = {
  'PUBLISHER': 'Éditeur',
  'PROVIDER': 'Prestataire',
  'SHOP': 'Boutique',
  'ASSOCIATION': 'Association',
  'ANIMATION': 'Animation / Zone Proto'
};

// Types qui sont considérés comme partenaires (remises possibles)
export const PARTNER_TYPES: ReservantType[] = ['SHOP', 'ASSOCIATION', 'ANIMATION'];

export interface Reservant {
  reservant_id: number;
  name: string;
  type: ReservantType;
  is_partner: boolean;
  email?: string;
  mobile?: string;
  role?: string;
}

export interface CreateReservantDTO {
  name: string;
  type: ReservantType;
  is_partner?: boolean;
  email?: string;
  mobile?: string;
  role?: string;
}

export interface UpdateReservantDTO {
  name?: string;
  type?: ReservantType;
  is_partner?: boolean;
  email?: string;
  mobile?: string;
  role?: string;
}
