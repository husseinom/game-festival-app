import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import {PriceZone, PriceZoneType } from '../../types/price-zone';

@Injectable({
  providedIn: 'root',
})
export class PriceZoneServices {
  private readonly http = inject(HttpClient);
  private readonly _priceZoneTypes = signal<PriceZoneType[]>([])
  private readonly _priceZones = signal<PriceZone[]>([])

  priceZoneTypes = this._priceZoneTypes.asReadonly();
  priceZones = this._priceZones.asReadonly()

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

  getPriceZones():void{
    this.http.get<PriceZone[]>(`${environment.apiUrl}/price_zone/zones`, {withCredentials: true})
    .subscribe({
          next: (data) => {
            this._priceZones.set(data);
          },
          error: (error) => {
            console.error('Error fetching priceZone types:', error);
          }
        });

  }

  getPriceZoneByFestivalId(festivalId: number): void{
    this.http.get<PriceZone[]>(`${environment.apiUrl}/price_zone/festival/${festivalId}`, {withCredentials: true})
    .subscribe({
      next: (data) =>{
        this._priceZones.set(data);
      },
      error: (error) => {
        console.error('Error fetching festival priceZone type', error)
      }
    });
  }

  findPriceZoneById(id: number): PriceZone | undefined {
        return this._priceZones().find(pz => pz.id === id);
    }

}
