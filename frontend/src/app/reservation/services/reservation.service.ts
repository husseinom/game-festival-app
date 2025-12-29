import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CreateReservationDTO, Reservation } from '../../types/reservation';

type ReservationResponse = { message: string; data: Reservation };
type MessageResponse = { message: string };

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reservations`;

  getAll(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/all`, { withCredentials: true });
  }

  getById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  create(payload: CreateReservationDTO): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/add`, payload, { withCredentials: true });
  }

  update(id: number, payload: Partial<CreateReservationDTO>): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(`${this.baseUrl}/${id}`, payload, { withCredentials: true });
  }

  delete(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
