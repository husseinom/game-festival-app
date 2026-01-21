export interface Reservant {
  reservant_id: number;
  name: string;
  type: string;
  email?: string;
  mobile?: string;
  role?: string;
}

export interface CreateReservantDTO {
  name: string;
  type: string;
  email?: string;
  mobile?: string;
  role?: string;
}

export interface UpdateReservantDTO {
  name?: string;
  type?: string;
  email?: string;
  mobile?: string;
  role?: string;
}
