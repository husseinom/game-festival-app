import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FestivalServices } from '../services/festival-services';
import { PriceZoneServices } from '../../PriceZone/services/price-zone-services';
import { Festival } from '../../types/festival';
import { PriceZone } from '../../types/price-zone';
import { MapZone } from '../../types/map-zone';
import { PriceZoneCard } from '../../PriceZone/price-zone-card/price-zone-card';
import { RoleService } from '../../shared/services/role.service';

@Component({
  selector: 'app-festival-details',
  imports: [PriceZoneCard],
  templateUrl: './festival-details.html',
  styleUrl: './festival-details.css',
})
export class FestivalDetails {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly _festivalServices = inject(FestivalServices)
  private readonly _priceZoneService = inject(PriceZoneServices)
  private readonly roleService = inject(RoleService)

  festivalId = signal<number | null>(null)
  showForm = signal(false)
  selectedPriceZoneId = signal<number | null>(null)

  festival = computed<Festival | null>(() => { // Éditeur sélectionné
    const id = this.festivalId()
    if (id === null) return null
    return this._festivalServices.findFestivalById(id) ?? null
  })

  // Tous les jeux (signal readonly du service)
  
  readonly priceZones = this._priceZoneService.priceZones

  // Jeux appartenant à cet éditeur (filtrage par pubId)
  festivalPZ = computed<PriceZone[]>(() => {
    const fest = this.festival()
    if (!fest) return []
    return this.priceZones().filter(g => g.festival_id === fest.id)
  })

  // Le jeu en cours d'édition
  editingGame = computed<PriceZone | null>(() => {
    const id = this.selectedPriceZoneId()
    if (id === null) return null
    return this._priceZoneService.findPriceZoneById(id) ?? null
  })

  constructor(){
    // listen to route params and fetch zones for the selected festival
    this.route.paramMap.subscribe(pm => {
      const idParam = pm.get('id');
      const id = idParam ? Number(idParam) : null;
      this.festivalId.set(id);
      if (id !== null) {
        this._priceZoneService.getPriceZoneByFestivalId(id);
      }
    });
  }

  toggleForm(){
    this.showForm.update(s => !s)
    if (!this.showForm()) {
      this.selectedPriceZoneId.set(null)
    }
  }

  // onNewGame(game: Omit<PriceZone,'id'>): void {
  //   // Plus besoin de forcer pubId, déjà correct si formulaire prérempli
  //   this.gameService.onNewGame(game)
  //   this.showForm.set(false)
  //   this.selectedGameId.set(null)
  // }

  // onUpdatePriceZone(data: {id: number, game: Omit<PriceZone,'id'>}): void {
  //   this.priceZoneService.updateGame(data.id, data.game)
  //   this.showForm.set(false)
  //   this.selectedGameId.set(null)
  // }

  // onEdit(id: number): void {
  //   this.selectedGameId.set(id)
  //   this.showForm.set(true)
  // }

  // onDelete(id: number): void {
  //   this.gameService.onDeleteGame(id)
  //   if (this.selectedGameId() === id) {
  //     this.selectedGameId.set(null)
  //   }
  // }
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
    this.router.navigate(['/festival-list'])
  }
}
