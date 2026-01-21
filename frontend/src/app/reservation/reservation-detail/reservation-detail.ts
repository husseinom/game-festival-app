import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../services/reservation.service';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  Reservation, 
  ReservationStatus, 
  RESERVATION_STATUS_LABELS, 
  InvoiceStatus, 
  INVOICE_STATUS_LABELS,
  FestivalGame,
  M2_PER_TABLE_UNIT,
  tablesToM2,
  GameSize,
  GAME_SIZE_LABELS,
  TableSize,
  TABLE_SIZE_LABELS,
  getGameUnits
} from '../../types/reservation';
import { ReservantTypeLabelPipe } from '../../shared/pipes/reservant-type-label.pipe';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, filter, BehaviorSubject, forkJoin, of } from 'rxjs';
import { GameDto } from '../../types/game-dto';
import { GameService } from '../../Game/services/game-service';
import { MapZoneService } from '../../MapZone/services/map-zone-services';
import { MapZone } from '../../types/map-zone';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, ReservantTypeLabelPipe],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.css'
})
export class ReservationDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly reservationService = inject(ReservationService);
  private readonly gameService = inject(GameService);
  private readonly mapZoneService = inject(MapZoneService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  // Signal pour rafraîchir la réservation
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  private readonly id$ = this.route.paramMap.pipe(
    map((params: any) => params.get('id')),
    filter((id: any): id is string => id !== null),
    map((id: string) => Number(id))
  );

  readonly reservation = toSignal(
    this.refresh$.pipe(
      switchMap(() => this.id$),
      switchMap((id: number) => this.reservationService.getById(id))
    ),
    { initialValue: null }
  );

  readonly publisher = computed(() => this.reservation()?.publisher ?? null);
  readonly reservant = computed(() => this.reservation()?.reservant ?? null);
  
  // Jeux disponibles de l'éditeur
  readonly publisherGames = signal<GameDto[]>([]);
  
  // Zones de plan disponibles (pour le placement)
  readonly availableMapZones = signal<MapZone[]>([]);
  
  // États UI
  readonly isAddingGames = signal(false);
  readonly selectedGameId = signal<number | null>(null);
  readonly selectedCopyCount = signal(1);
  readonly selectedGameSize = signal<GameSize>('STANDARD');
  readonly selectedAllocatedTables = signal(1);
  readonly isLoading = signal(false);
  
  // Pour le placement de jeu dans une zone
  readonly editingGameId = signal<number | null>(null);
  readonly selectedMapZoneId = signal<number | null>(null);
  readonly selectedTableSize = signal<TableSize>('STANDARD');

  // Exposer les labels pour le template
  readonly gameSizeOptions = Object.entries(GAME_SIZE_LABELS).map(([value, label]) => ({ value, label }));
  readonly tableSizeOptions = Object.entries(TABLE_SIZE_LABELS).map(([value, label]) => ({ value, label }));

  constructor() {
    // Charger les jeux de l'éditeur quand la réservation change
    this.loadPublisherGames();
  }

  private loadPublisherGames(): void {
    const r = this.reservation();
    if (r?.publisher?.id) {
      this.gameService.getGamesByPublisher(r.publisher.id).subscribe({
        next: (games: GameDto[]) => this.publisherGames.set(games),
        error: (err: any) => console.error('Erreur chargement jeux:', err)
      });
    }
  }

  // Charge les zones de plan disponibles pour toutes les zones tarifaires de la réservation
  private loadAvailableMapZones(): void {
    const r = this.reservation();
    if (!r?.zones || r.zones.length === 0) {
      this.availableMapZones.set([]);
      return;
    }

    // Pour chaque zone tarifaire de la réservation, charger les zones de plan associées
    const priceZoneIds = r.zones.map(z => z.priceZone.id);
    const requests = priceZoneIds.map(pzId => 
      this.mapZoneService.getByPriceZoneObs(pzId)
    );

    if (requests.length === 0) {
      this.availableMapZones.set([]);
      return;
    }

    forkJoin(requests).subscribe({
      next: (results: MapZone[][]) => {
        // Fusionner et dédupliquer les zones
        const allZones = results.flat();
        const uniqueZones = allZones.filter((zone, index, self) => 
          index === self.findIndex(z => z.id === zone.id)
        );
        this.availableMapZones.set(uniqueZones);
      },
      error: (err: any) => console.error('Erreur chargement zones:', err)
    });
  }

  private refreshReservation(): void {
    this.refresh$.next();
  }

  goBack(): void {
    this.router.navigate(['/reservations']);
  }

  goToEdit(): void {
    const r = this.reservation();
    if (r) {
      this.router.navigate(['/reservation', r.reservation_id, 'edit']);
    }
  }

  getStatusLabel(status?: ReservationStatus): string {
    return status ? RESERVATION_STATUS_LABELS[status] || status : 'Non défini';
  }

  getInvoiceStatusLabel(status?: InvoiceStatus): string {
    return status ? INVOICE_STATUS_LABELS[status] || status : 'Non défini';
  }

  // ============================================
  // Calculs espace / tables / m²
  // ============================================

  getTotalTables(): number {
    const r = this.reservation();
    if (!r?.zones) return 0;
    return r.zones.reduce((sum, z) => sum + (z.table_count || 0), 0);
  }

  getTotalM2(): number {
    const r = this.reservation();
    if (!r?.zones) return 0;
    return r.zones.reduce((sum, z) => sum + (z.space_m2 || tablesToM2(z.table_count || 0)), 0);
  }

  // ============================================
  // Workflow de statut
  // ============================================

  updateStatus(newStatus: ReservationStatus): void {
    const r = this.reservation();
    if (!r) return;
    
    this.isLoading.set(true);
    this.reservationService.updateStatus(r.reservation_id, newStatus).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur mise à jour statut:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ============================================
  // Facturation
  // ============================================

  markAsInvoiced(): void {
    const r = this.reservation();
    if (!r) return;
    
    this.isLoading.set(true);
    this.reservationService.markAsInvoiced(r.reservation_id).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur facturation:', err);
        this.isLoading.set(false);
      }
    });
  }

  markAsPaid(): void {
    const r = this.reservation();
    if (!r) return;
    
    this.isLoading.set(true);
    this.reservationService.markAsPaid(r.reservation_id).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur paiement:', err);
        this.isLoading.set(false);
      }
    });
  }

  applyPartnerDiscount(): void {
    const r = this.reservation();
    if (!r) return;
    
    this.isLoading.set(true);
    this.reservationService.applyPartnerDiscount(r.reservation_id).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur remise partenaire:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ============================================
  // Phase logistique - Gestion des jeux
  // ============================================

  requestGameList(): void {
    const r = this.reservation();
    if (!r) return;
    
    this.isLoading.set(true);
    this.reservationService.requestGameList(r.reservation_id).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur demande liste:', err);
        this.isLoading.set(false);
      }
    });
  }

  markGameListReceived(): void {
    const r = this.reservation();
    if (!r) return;
    
    this.isLoading.set(true);
    this.reservationService.markGameListReceived(r.reservation_id).subscribe({
      next: () => {
        this.refreshReservation();
        this.loadPublisherGames();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur réception liste:', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleAddGames(): void {
    this.isAddingGames.update((v: boolean) => !v);
    if (this.isAddingGames()) {
      this.loadPublisherGames();
      this.loadAvailableMapZones();
    }
  }

  // Calculer les tables automatiquement en fonction de game_size et copy_count
  updateAllocatedTables(): void {
    const gameSize = this.selectedGameSize();
    const copyCount = this.selectedCopyCount();
    const units = getGameUnits(gameSize);
    this.selectedAllocatedTables.set(units * copyCount);
  }

  // ============================================
  // Handlers pour les inputs sans ngModel
  // ============================================

  onGameIdChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedGameId.set(value && value !== 'null' ? Number(value) : null);
  }

  onCopyCountChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedCopyCount.set(Number(target.value) || 1);
    this.updateAllocatedTables();
  }

  onGameSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedGameSize.set(target.value as GameSize);
    this.updateAllocatedTables();
  }

  onAllocatedTablesChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedAllocatedTables.set(Number(target.value) || 1);
  }

  onMapZoneChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedMapZoneId.set(value && value !== 'null' ? Number(value) : null);
  }

  onTableSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedTableSize.set(target.value as TableSize);
  }

  addSelectedGame(): void {
    const r = this.reservation();
    const gameId = this.selectedGameId();
    const copyCount = this.selectedCopyCount();
    const gameSize = this.selectedGameSize();
    const allocatedTables = this.selectedAllocatedTables();
    
    if (!r || !gameId) return;
    
    this.isLoading.set(true);
    this.reservationService.addGames(r.reservation_id, [{ 
      game_id: gameId, 
      copy_count: copyCount,
      game_size: gameSize,
      allocated_tables: allocatedTables
    }]).subscribe({
      next: () => {
        this.refreshReservation();
        this.selectedGameId.set(null);
        this.selectedCopyCount.set(1);
        this.selectedGameSize.set('STANDARD');
        this.selectedAllocatedTables.set(1);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur ajout jeu:', err);
        this.isLoading.set(false);
      }
    });
  }

  markGamesReceived(): void {
    const r = this.reservation();
    if (!r) return;
    
    this.isLoading.set(true);
    this.reservationService.markGamesReceived(r.reservation_id).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur réception jeux:', err);
        this.isLoading.set(false);
      }
    });
  }

  markGameAsReceived(festivalGameId: number): void {
    this.isLoading.set(true);
    this.reservationService.markGameAsReceived(festivalGameId).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur pointage jeu:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ============================================
  // Helpers
  // ============================================

  get canRequestGameList(): boolean {
    const r = this.reservation();
    return !!r && r.status === 'CONFIRMED' && !r.game_list_requested;
  }

  get canMarkGameListReceived(): boolean {
    const r = this.reservation();
    return !!r && r.game_list_requested && !r.game_list_received;
  }

  get canAddGames(): boolean {
    const r = this.reservation();
    return !!r && r.game_list_received;
  }

  get canMarkGamesReceived(): boolean {
    const r = this.reservation();
    return !!r && !!r.games && r.games.length > 0 && r.games_received === false;
  }

  get isPartner(): boolean {
    const r = this.reservation();
    return !!r?.reservant?.is_partner;
  }

  getTotalAllocatedTables(): number {
    const r = this.reservation();
    if (!r?.games) return 0;
    return r.games.reduce((sum: number, g: FestivalGame) => sum + (g.allocated_tables || 0), 0);
  }

  getReceivedGamesCount(): number {
    const r = this.reservation();
    if (!r?.games) return 0;
    return r.games.filter((g: FestivalGame) => g.is_received).length;
  }

  // ============================================
  // Placement des jeux dans les zones
  // ============================================

  // Activer le mode édition pour placer un jeu dans une zone
  startPlacingGame(festivalGame: FestivalGame): void {
    this.editingGameId.set(festivalGame.id);
    this.selectedMapZoneId.set(festivalGame.map_zone_id ?? null);
    this.selectedTableSize.set(festivalGame.table_size || 'STANDARD');
    this.loadAvailableMapZones();
  }

  // Annuler le mode édition
  cancelPlacing(): void {
    this.editingGameId.set(null);
    this.selectedMapZoneId.set(null);
    this.selectedTableSize.set('STANDARD');
  }

  // Vérifier si une zone est valide pour un jeu (doit être dans une zone tarifaire de la réservation)
  isZoneValidForGame(mapZone: MapZone): boolean {
    const r = this.reservation();
    if (!r?.zones) return false;
    
    // Vérifier que la zone de plan appartient à une zone tarifaire de cette réservation
    return r.zones.some(z => z.priceZone.id === mapZone.price_zone_id);
  }

  // Placer le jeu dans la zone sélectionnée
  placeGameInZone(festivalGame: FestivalGame): void {
    const mapZoneId = this.selectedMapZoneId();
    if (!mapZoneId) return;

    // Vérifier les limites de tables
    if (!this.checkTableLimits(festivalGame, mapZoneId)) {
      alert('Cette zone n\'a pas assez de tables disponibles pour ce jeu');
      return;
    }

    this.isLoading.set(true);
    this.reservationService.placeGame(
      festivalGame.id, 
      mapZoneId, 
      this.selectedTableSize(),
      festivalGame.allocated_tables || 1
    ).subscribe({
      next: () => {
        this.refreshReservation();
        this.cancelPlacing();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur placement jeu:', err);
        alert(err.error?.message || 'Erreur lors du placement');
        this.isLoading.set(false);
      }
    });
  }

  // Retirer un jeu d'une zone
  unplaceGame(festivalGameId: number): void {
    if (!confirm('Retirer ce jeu de sa zone ?')) return;
    
    this.isLoading.set(true);
    this.reservationService.unplaceGame(festivalGameId).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur retrait jeu:', err);
        this.isLoading.set(false);
      }
    });
  }

  // Vérifier que le nombre de tables demandées ne dépasse pas les limites
  private checkTableLimits(festivalGame: FestivalGame, mapZoneId: number): boolean {
    const r = this.reservation();
    const mapZone = this.availableMapZones().find(z => z.id === mapZoneId);
    
    if (!r || !mapZone) return false;

    // Compter les tables déjà placées dans cette zone pour cette réservation
    const tablesAlreadyInZone = (r.games || [])
      .filter((g: FestivalGame) => g.map_zone_id === mapZoneId && g.id !== festivalGame.id)
      .reduce((sum: number, g: FestivalGame) => sum + (g.allocated_tables || 0), 0);

    // Récupérer le nombre de tables réservées pour cette zone tarifaire
    const zoneReservation = r.zones?.find(z => z.priceZone.id === mapZone.price_zone_id);
    const maxTables = zoneReservation?.table_count || 0;

    const newTotal = tablesAlreadyInZone + (festivalGame.allocated_tables || 1);
    
    return newTotal <= maxTables;
  }

  // Obtenir un résumé des tables utilisées par zone
  getZoneUsageSummary(): { zoneName: string; used: number; max: number; priceZoneId: number }[] {
    const r = this.reservation();
    if (!r?.zones || !r?.games) return [];

    return r.zones.map(zone => {
      const used = (r.games || [])
        .filter((g: FestivalGame) => {
          const gameZone = this.availableMapZones().find(z => z.id === g.map_zone_id);
          return gameZone?.price_zone_id === zone.priceZone.id;
        })
        .reduce((sum: number, g: FestivalGame) => sum + (g.allocated_tables || 0), 0);

      // Gérer le cas où name est un objet PriceZoneType ou une string
      const zoneName = typeof zone.priceZone.name === 'object' 
        ? (zone.priceZone.name as any).name 
        : String(zone.priceZone.name);

      return {
        zoneName,
        used,
        max: zone.table_count,
        priceZoneId: zone.priceZone.id
      };
    });
  }

  // Obtenir le label de la taille d'un jeu
  getGameSizeLabel(gameSize: GameSize | undefined): string {
    return gameSize ? GAME_SIZE_LABELS[gameSize] || gameSize : 'Standard';
  }

  // Obtenir le label de la taille de table
  getTableSizeLabel(tableSize: TableSize | undefined): string {
    return tableSize ? TABLE_SIZE_LABELS[tableSize] || tableSize : 'Standard';
  }

  // Compte de jeux placés
  getPlacedGamesCount(): number {
    const r = this.reservation();
    if (!r?.games) return 0;
    return r.games.filter((g: FestivalGame) => g.map_zone_id !== null && g.map_zone_id !== undefined).length;
  }
}