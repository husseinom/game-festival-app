import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import { PriceZone, PriceZoneType } from '../../types/price-zone';

@Injectable({
  providedIn: 'root',
})
export class PriceZoneServices {
  private readonly http = inject(HttpClient);
  private readonly _priceZoneTypes = signal<PriceZoneType[]>([]);
  private readonly _priceZones = signal<PriceZone[]>([]);
  private readonly _priceZoneReservations = signal<any[]>([]);
  private readonly _priceZoneGames = signal<any[]>([]);

  priceZoneTypes = this._priceZoneTypes.asReadonly();
  priceZones = this._priceZones.asReadonly();
  priceZoneReservations = this._priceZoneReservations.asReadonly();
  priceZoneGames = this._priceZoneGames.asReadonly();

  getPriceZoneTypes(): void {
    this.http.get<PriceZoneType[]>(`${environment.apiUrl}/price_zone/types`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._priceZoneTypes.set(data);
        },
        error: (error) => {
          console.error('Error fetching priceZone types:', error);
        }
      });
  }

  getPriceZones(): void {
    this.http.get<PriceZone[]>(`${environment.apiUrl}/price_zone/zones`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._priceZones.set(data);
        },
        error: (error) => {
          console.error('Error fetching priceZone types:', error);
        }
      });
  }

  getPriceZoneByFestivalId(festivalId: number): void {
    this.http.get<PriceZone[]>(`${environment.apiUrl}/price_zone/festival/${festivalId}`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._priceZones.set(data);
        },
        error: (error) => {
          console.error('Error fetching festival priceZone type', error);
        }
      });
  }

  updatePriceZone(id: number, updates: Partial<PriceZone>): void {
    this.http.put<PriceZone>(`${environment.apiUrl}/price_zone/${id}`, updates, { withCredentials: true })
      .subscribe({
        next: (updated) => {
          const current = this._priceZones();
          const index = current.findIndex(pz => pz.id === id);
          if (index > -1) {
            const newPriceZones = [...current];
            newPriceZones[index] = updated;
            this._priceZones.set(newPriceZones);
          }
        },
        error: (error) => {
          console.error('Error updating price zone:', error);
        }
      });
  }

  deletePriceZone(id: number): void {
    this.http.delete(`${environment.apiUrl}/price_zone/${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          const current = this._priceZones();
          this._priceZones.set(current.filter(pz => pz.id !== id));
        },
        error: (error) => {
          console.error('Error deleting price zone:', error);
        }
      });
  }

  getReservationsByPriceZone(priceZoneId: number): void {
    this.http.get<any[]>(`${environment.apiUrl}/price_zone/${priceZoneId}/reservations`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._priceZoneReservations.set(data);
        },
        error: (error) => {
          console.error('Error fetching price zone reservations:', error);
        }
      });
  }

  getGamesByPriceZone(priceZoneId: number): void {
    this.http.get<any[]>(`${environment.apiUrl}/price_zone/${priceZoneId}/games`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._priceZoneGames.set(data);
        },
        error: (error) => {
          console.error('Error fetching price zone games:', error);
        }
      });
  }

  findPriceZoneById(id: number): PriceZone | undefined {
    return this._priceZones().find(pz => pz.id === id);
  }

  clearPriceZones(): void {
    this._priceZones.set([]);
  }

  clearPriceZoneReservations(): void {
    this._priceZoneReservations.set([]);
  }

  clearPriceZoneGames(): void {
    this._priceZoneGames.set([]);
  }
}
