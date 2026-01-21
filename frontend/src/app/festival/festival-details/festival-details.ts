import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FestivalServices } from '../services/festival-services';
import { PriceZoneServices } from '../../PriceZone/services/price-zone-services';
import { PriceZoneCard } from '../../PriceZone/price-zone-card/price-zone-card';
import { PriceZoneEditForm } from '../../PriceZone/price-zone-edit-form/price-zone-edit-form';
import { Festival } from '../../types/festival';
import { PriceZone } from '../../types/price-zone';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../shared/services/role.service';

@Component({
  selector: 'app-festival-details',
  standalone: true,
  imports: [CommonModule, PriceZoneCard, PriceZoneEditForm, MatButtonModule],
  templateUrl: './festival-details.html',
  styleUrl: './festival-details.css',
})
export class FestivalDetails {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly _festivalServices = inject(FestivalServices)
  private readonly _priceZoneService = inject(PriceZoneServices)
  private readonly roleService = inject(RoleService)

  festivalId = signal<number | null>(null);
  showEditForm = signal(false);
  selectedPriceZoneId = signal<number | null>(null);

  festival = computed<Festival | null>(() => {
    const id = this.festivalId();
    if (id === null) return null;
    return this._festivalServices.findFestivalById(id) ?? null;
  });

  readonly priceZones = this._priceZoneService.priceZones;

  festivalPZ = computed<PriceZone[]>(() => {
    const fest = this.festival();
    if (!fest) return [];
    return this.priceZones().filter(pz => pz.festival_id === fest.id);
  });

  editingPriceZone = computed<PriceZone | null>(() => {
    const id = this.selectedPriceZoneId();
    if (id === null) return null;
    return this.festivalPZ().find(pz => pz.id === id) ?? null;
  });

  canEditPriceZones = computed<boolean>(() => {
    return this.festivalPZ().length >= 2;
  });

  // Get all map zones for this festival
  festivalMapZones = computed(() => {
    const pzs = this.festivalPZ();
    const allMapZones = pzs.flatMap(pz => pz.mapZones || []);
    return allMapZones;
  });

  // Add this computed signal to get the other price zone
  otherPriceZone = computed(() => {
    const editing = this.editingPriceZone();
    if (!editing) return undefined;
    
    return this.festivalPZ().find(pz => pz.id !== editing.id);
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const festivalId = Number(id);
        this.festivalId.set(festivalId);
        this._priceZoneService.getPriceZoneByFestivalId(festivalId);
      }
    });
  }

  toggleEditForm(): void {
    this.showEditForm.set(!this.showEditForm());
    if (!this.showEditForm()) {
      this.selectedPriceZoneId.set(null);
    }
  }

  onEditPriceZone(id: number): void {
    console.log('onEditPriceZone called with ID:', id); // Debug log
    this.selectedPriceZoneId.set(id);
    this.showEditForm.set(true);
  }

  onUpdatePriceZone(data: { id: number, updates: Partial<PriceZone> & { mapZoneIds?: number[] } }): void {
    console.log('onUpdatePriceZone called:', data);
    this._priceZoneService.updatePriceZone(data.id, data.updates);
    this.showEditForm.set(false);
    this.selectedPriceZoneId.set(null);
  }

  onDeletePriceZone(id: number): void {
    console.log('onDeletePriceZone called with ID:', id);
    // Dialog confirmation is now handled in the card component
    this._priceZoneService.deletePriceZone(id);
  }

  goToPriceZone(id: number): void {
    const festId = this.festivalId();
    // SUPER_ORGANISATOR et ADMIN voient la vue de gestion
    if (this.roleService.isSuperOrganisator()) {
      this.router.navigate(['/price-zone', id]);
    } else {
      // VISITOR, VOLUNTEER, ORGANISATOR voient la vue publique
      if (festId) {
        this.router.navigate(['/festival', festId, 'zone', id]);
      }
    }
  }

  back(): void {
    this.router.navigate(['/festival-list']);
  }
}
