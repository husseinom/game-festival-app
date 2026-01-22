import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { PriceZoneServices } from '../services/price-zone-services';
import { PriceZone } from '../../types/price-zone';

@Component({
  selector: 'app-price-zone-public',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './price-zone-public.html',
  styleUrl: './price-zone-public.css'
})
export class PriceZonePublicComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly _priceZoneService = inject(PriceZoneServices);

  priceZoneId = signal<number | null>(null);
  festivalId = signal<number | null>(null);

  // Games from service
  readonly games = this._priceZoneService.priceZoneGames;
  readonly priceZones = this._priceZoneService.priceZones;

  // Get price zone info
  priceZone = computed<PriceZone | null>(() => {
    const id = this.priceZoneId();
    if (id === null) return null;
    return this._priceZoneService.findPriceZoneById(id) ?? null;
  });

  // Group games by map zone for display
  gamesByMapZone = computed(() => {
    const allGames = this.games();
    const grouped = new Map<string, { mapZone: any; games: any[] }>();
    
    for (const game of allGames) {
      const zoneName = game.mapZone?.name || 'Non assigné';
      const zoneId = game.mapZone?.id || 0;
      const key = `${zoneId}-${zoneName}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          mapZone: game.mapZone || { id: 0, name: 'Non assigné' },
          games: []
        });
      }
      grouped.get(key)!.games.push(game);
    }
    
    // Sort by map zone name and return as array
    return Array.from(grouped.values()).sort((a, b) => 
      a.mapZone.name.localeCompare(b.mapZone.name)
    );
  });

  // Total games count
  totalGames = computed(() => this.games().length);

  constructor() {
    // Listen to route params
    this.route.paramMap.subscribe(pm => {
      const idParam = pm.get('id');
      const festivalIdParam = pm.get('festivalId');
      
      const id = idParam ? Number(idParam) : null;
      const festId = festivalIdParam ? Number(festivalIdParam) : null;
      
      this.priceZoneId.set(id);
      this.festivalId.set(festId);
      
      // First load price zones for the festival to get zone info
      if (festId !== null) {
        this._priceZoneService.getPriceZoneByFestivalId(festId);
      }
      
      // Then load games for this price zone (using public endpoint)
      if (id !== null) {
        this._priceZoneService.getPublicGamesByPriceZone(id);
      }
    });
  }

  back(): void {
    const festId = this.festivalId();
    if (festId) {
      this.router.navigate(['/festival', festId]);
    } else {
      window.history.back();
    }
  }
}
