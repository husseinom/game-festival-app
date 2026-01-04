export interface Reservant {
  reservant_id: number;
  name: string;
  type: string;
}

export interface CreateReservantDTO {
  name: string;
  type: string;
}
