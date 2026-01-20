import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PriceZoneServices } from '../services/price-zone-services';
import { MapZoneService } from '../../MapZone/services/map-zone-services';
import { PriceZone } from '../../types/price-zone';

@Component({
  selector: 'app-price-zone-details',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatTabsModule, 
    MatButtonModule, 
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './price-zone-details.html',
  styleUrl: './price-zone-details.css'
})
export class PriceZoneDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly _priceZoneService = inject(PriceZoneServices);
  private readonly _mapZoneService = inject(MapZoneService);

  priceZoneId = signal<number | null>(null);
  festivalId = signal<number | null>(null);
  showMapZoneForm = signal(false);
  
  newMapZone = signal({
    name: '',
    small_tables: 0,
    large_tables: 0,
    city_tables: 0,
    gameIds: [] as number[]
  });

  // Computed properties from services
  readonly reservations = this._priceZoneService.priceZoneReservations;
  readonly games = this._priceZoneService.priceZoneGames;
  readonly mapZones = this._mapZoneService.mapZones;

  priceZone = computed<PriceZone | null>(() => {
    const id = this.priceZoneId();
    if (id === null) return null;
    return this._priceZoneService.findPriceZoneById(id) ?? null;
  });

  unassignedGames = computed(() => {
    return this.games().filter(g => !g.map_zone_id);
  });

  // Calculate allocated tables from existing map zones
  allocatedTables = computed(() => {
    const zones = this.mapZones();
    return zones.reduce((acc, zone) => ({
      small: acc.small + zone.small_tables,
      large: acc.large + zone.large_tables,
      city: acc.city + zone.city_tables
    }), { small: 0, large: 0, city: 0 });
  });

  // Calculate available tables (total - already allocated in existing zones)
  availableTables = computed(() => {
    const zone = this.priceZone();
    const allocated = this.allocatedTables();
    
    if (!zone) return { small: 0, large: 0, city: 0 };
    
    return {
      small: zone.small_tables - allocated.small,
      large: zone.large_tables - allocated.large,
      city: zone.city_tables - allocated.city
    };
  });

  // Calculate remaining tables after considering current form input
  remainingTables = computed(() => {
    const available = this.availableTables();
    const current = this.newMapZone();
    
    return {
      small: available.small - current.small_tables,
      large: available.large - current.large_tables,
      city: available.city - current.city_tables
    };
  });

  totalTables = computed(() => {
    const zone = this.newMapZone();
    return (zone.small_tables || 0) + (zone.large_tables || 0) + (zone.city_tables || 0);
  });

  // Validation errors
  validationError = signal<string | null>(null);

  constructor() {
    // Listen to route params
    this.route.paramMap.subscribe(pm => {
      const idParam = pm.get('id');
      const id = idParam ? Number(idParam) : null;
      this.priceZoneId.set(id);
      
      if (id !== null) {
        this._priceZoneService.getReservationsByPriceZone(id);
        this._priceZoneService.getGamesByPriceZone(id);
        this._mapZoneService.getByPriceZone(id);
      }
    });

    // Get festivalId from query params
    this.route.queryParamMap.subscribe(qpm => {
      const festIdParam = qpm.get('festivalId');
      const festId = festIdParam ? Number(festIdParam) : null;
      this.festivalId.set(festId);
    });
  }

  toggleMapZoneForm(): void {
    this.showMapZoneForm.update(s => !s);
    if (!this.showMapZoneForm()) {
      this.resetMapZoneForm();
      this.validationError.set(null);
    }
  }

  openMapZoneForm(): void {
    this.showMapZoneForm.set(true);
    this.validationError.set(null);
  }

  toggleGameSelection(gameId: number): void {
    this.newMapZone.update(zone => ({
      ...zone,
      gameIds: zone.gameIds.includes(gameId)
        ? zone.gameIds.filter(id => id !== gameId)
        : [...zone.gameIds, gameId]
    }));
  }

  isGameSelected(gameId: number): boolean {
    return this.newMapZone().gameIds.includes(gameId);
  }

  validateTables(): boolean {
    const zone = this.newMapZone();
    const available = this.availableTables();

    if (zone.small_tables > available.small) {
      this.validationError.set(
        `Not enough small tables available. Requested: ${zone.small_tables}, Available: ${available.small}`
      );
      return false;
    }

    if (zone.large_tables > available.large) {
      this.validationError.set(
        `Not enough large tables available. Requested: ${zone.large_tables}, Available: ${available.large}`
      );
      return false;
    }

    if (zone.city_tables > available.city) {
      this.validationError.set(
        `Not enough city tables available. Requested: ${zone.city_tables}, Available: ${available.city}`
      );
      return false;
    }

    this.validationError.set(null);
    return true;
  }

  createMapZone(): void {
    const zone = this.newMapZone();
    const pzId = this.priceZoneId();
    
    if (!zone.name.trim() || this.totalTables() === 0 || pzId === null) {
      this.validationError.set('Please provide a name and at least one table');
      return;
    }

    // Validate tables
    if (!this.validateTables()) {
      return;
    }
    
    this._mapZoneService.create({
      name: zone.name,
      small_tables: zone.small_tables || 0,
      large_tables: zone.large_tables || 0,
      city_tables: zone.city_tables || 0,
      price_zone_id: pzId,
      gameIds: zone.gameIds
    });

    // Reload data after creation
    setTimeout(() => {
      if (pzId !== null) {
        this._mapZoneService.getByPriceZone(pzId);
        this._priceZoneService.getGamesByPriceZone(pzId);
      }
    }, 500);

    this.showMapZoneForm.set(false);
    this.resetMapZoneForm();
    this.validationError.set(null);
  }

  deleteMapZone(id: number): void {
    if (confirm('Delete this map zone?')) {
      this._mapZoneService.delete(id);
      
      // Reload games after deletion
      setTimeout(() => {
        const pzId = this.priceZoneId();
        if (pzId !== null) {
          this._priceZoneService.getGamesByPriceZone(pzId);
        }
      }, 500);
    }
  }

  viewReservation(reservationId: number): void {
    this.router.navigate(['/reservation', reservationId]);
  }

  back(): void {
    const festId = this.festivalId();
    if (festId !== null) {
      this.router.navigate(['/festival', festId]);
    } else {
      // If no festivalId in query params, try to get it from the price zone
      const zone = this.priceZone();
      if (zone?.festival_id) {
        this.router.navigate(['/festival', zone.festival_id]);
      } else {
        // Fallback to festival list if we can't determine the festival
        this.router.navigate(['/festival-list']);
      }
    }
  }

  updateMapZoneName(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.newMapZone.update(z => ({ ...z, name: value }));
  }

  updateSmallTables(event: Event): void {
    const value = +(event.target as HTMLInputElement).value || 0;
    this.newMapZone.update(z => ({ ...z, small_tables: Math.max(0, value) }));
    this.validateTables();
  }

  updateLargeTables(event: Event): void {
    const value = +(event.target as HTMLInputElement).value || 0;
    this.newMapZone.update(z => ({ ...z, large_tables: Math.max(0, value) }));
    this.validateTables();
  }

  updateCityTables(event: Event): void {
    const value = +(event.target as HTMLInputElement).value || 0;
    this.newMapZone.update(z => ({ ...z, city_tables: Math.max(0, value) }));
    this.validateTables();
  }

  private resetMapZoneForm(): void {
    this.newMapZone.set({
      name: '',
      small_tables: 0,
      large_tables: 0,
      city_tables: 0,
      gameIds: []
    });
  }
}
