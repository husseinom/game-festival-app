import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { signal, WritableSignal } from '@angular/core';
import { Reservant, CreateReservantDTO, UpdateReservantDTO } from '../../types/reservant';
import { map, Observable } from 'rxjs';

type ReservantApiResponse = { message?: string; data: Reservant } | Reservant;

@Injectable({
  providedIn: 'root'
})
export class ReservantService {
  private readonly http = inject(HttpClient);
  private readonly _reservants: WritableSignal<Reservant[]> = signal<Reservant[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly reservants = this._reservants.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  private unwrapReservant(response: ReservantApiResponse): Reservant {
    return (response as any).data ?? (response as Reservant);
  }

  getReservants(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<Reservant[]>(`${environment.apiUrl}/reservants/all`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._reservants.set(data);
          this._isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching reservants:', error);
          this._error.set('Failed to load reservants.');
          this._isLoading.set(false);
        }
      });
  }

  getById(id: number): Observable<Reservant> {
    return this.http.get<Reservant>(`${environment.apiUrl}/reservants/${id}`, { withCredentials: true });
  }

  create(reservant: CreateReservantDTO): Observable<Reservant> {
    return this.http
      .post<ReservantApiResponse>(`${environment.apiUrl}/reservants/add`, reservant, { withCredentials: true })
      .pipe(map(res => this.unwrapReservant(res)));
  }

  onNewReservant(reservant: CreateReservantDTO): void {
    this.create(reservant).subscribe({
      next: (newReservant) => {
        this._reservants.update(reservants => [...reservants, newReservant]);
      },
      error: (error) => {
        console.error('Error creating reservant:', error);
      }
    });
  }

  update(id: number, payload: UpdateReservantDTO): Observable<Reservant> {
    return this.http
      .patch<ReservantApiResponse>(`${environment.apiUrl}/reservants/${id}`, payload, { withCredentials: true })
      .pipe(map(res => this.unwrapReservant(res)));
  }

  onUpdateReservant(id: number, payload: UpdateReservantDTO): void {
    this.update(id, payload).subscribe({
      next: (updatedReservant) => {
        this._reservants.update(reservants => reservants.map(r => r.reservant_id === id ? updatedReservant : r));
      },
      error: (error) => {
        console.error('Error updating reservant:', error);
        this._error.set('Failed to update reservant.');
      }
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reservants/${id}`, { withCredentials: true });
  }

  onDeleteReservant(id: number): void {
    this.delete(id).subscribe({
      next: () => {
        this._reservants.update(reservants => reservants.filter(r => r.reservant_id !== id));
      },
      error: (error) => {
        console.error('Error deleting reservant:', error);
      }
    });
  }

  findReservantById(id: number): Reservant | undefined {
    return this._reservants().find(r => r.reservant_id === id);
  }

  removeAllReservants(): void {
    this._reservants.set([]);
  }
}
