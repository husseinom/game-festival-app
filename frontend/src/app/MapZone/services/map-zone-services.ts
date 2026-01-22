import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MapZone } from '../../types/map-zone';

@Injectable({
  providedIn: 'root',
})
export class MapZoneService {
  private readonly http = inject(HttpClient);
  private readonly _mapZones = signal<MapZone[]>([]);

  mapZones = this._mapZones.asReadonly();

  // Retourne un Observable pour les map zones d'un festival
  getByFestivalObs(festivalId: number): Observable<MapZone[]> {
    return this.http.get<MapZone[]>(`${environment.apiUrl}/map_zones/festival/${festivalId}`, { withCredentials: true });
  }

  // Retourne un Observable (utile pour forkJoin)
  getByPriceZoneObs(priceZoneId: number): Observable<MapZone[]> {
    return this.http.get<MapZone[]>(`${environment.apiUrl}/map_zones/price-zone/${priceZoneId}`, { withCredentials: true });
  }

  getByPriceZone(priceZoneId: number): void {
    this.http.get<MapZone[]>(`${environment.apiUrl}/map_zones/price-zone/${priceZoneId}`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._mapZones.set(data);
        },
        error: (error) => {
          console.error('Error fetching map zones:', error);
        }
      });
  }

  create(data: any): void {
    this.http.post<MapZone>(`${environment.apiUrl}/map_zones`, data, { withCredentials: true })
      .subscribe({
        next: (newMapZone) => {
          this._mapZones.update(zones => [...zones, newMapZone]);
        },
        error: (error) => {
          console.error('Error creating map zone:', error);
        }
      });
  }

  delete(id: number): void {
    this.http.delete<void>(`${environment.apiUrl}/map_zones/${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this._mapZones.update(zones => zones.filter(z => z.id !== id));
        },
        error: (error) => {
          console.error('Error deleting map zone:', error);
          const message = error.error?.error || error.error?.message || 'Erreur lors de la suppression de la zone';
          alert(message);
        }
      });
  }

  findMapZoneById(id: number): MapZone | undefined {
    return this._mapZones().find(mz => mz.id === id);
  }

  clearMapZones(): void {
    this._mapZones.set([]);
  }
}