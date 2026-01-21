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

  // Charge les zones de plan disponibles pour le festival de la réservation
  // Filtrées par les zones tarifaires de la réservation
  private loadAvailableMapZones(): void {
    const r = this.reservation();
    if (!r?.festival_id) {
      this.availableMapZones.set([]);
      return;
    }

    // Récupérer les IDs des zones tarifaires de la réservation
    const reservationPriceZoneIds = (r.zones || []).map((z: any) => z.price_zone_id);

    // Charger les map zones du festival
    this.mapZoneService.getByFestivalObs(r.festival_id).subscribe({
      next: (zones: MapZone[]) => {
        // Filtrer les MapZones pour ne garder que celles qui appartiennent 
        // aux zones tarifaires de la réservation
        const filteredZones = reservationPriceZoneIds.length > 0
          ? zones.filter(z => reservationPriceZoneIds.includes(z.price_zone_id))
          : zones;
        this.availableMapZones.set(filteredZones);
      },
      error: (err: any) => console.error('Erreur chargement zones:', err)
    });
  }

  private refreshReservation(): void {
    this.refresh$.next();
    // Recharger aussi les MapZones pour mettre à jour nb_available
    this.loadAvailableMapZones();
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
    const result = units * copyCount;
    console.log('[updateAllocatedTables] gameSize:', gameSize, 'units:', units, 'copyCount:', copyCount, 'result:', result);
    this.selectedAllocatedTables.set(result);
  }

  // ============================================
  // Handlers pour les inputs sans ngModel
  // ============================================

  onGameIdChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedGameId.set(value ? Number(value) : null);
  }

  onCopyCountChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedCopyCount.set(Number(target.value) || 1);
    this.updateAllocatedTables();
  }

  onGameSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = target.value as GameSize;
    console.log('[onGameSizeChange] New size selected:', newSize);
    this.selectedGameSize.set(newSize);
    this.updateAllocatedTables();
    console.log('[onGameSizeChange] Allocated tables updated to:', this.selectedAllocatedTables());
  }

  onAllocatedTablesChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    // Le minimum est défini par la taille du jeu * nombre d'exemplaires
    const minRequired = this.getMinRequiredTables();
    this.selectedAllocatedTables.set(isNaN(value) || value < minRequired ? minRequired : value);
  }

  // Calculer le nombre minimum de tables requis pour le jeu sélectionné
  getMinRequiredTables(): number {
    const gameSize = this.selectedGameSize();
    const copyCount = this.selectedCopyCount();
    return getGameUnits(gameSize) * copyCount;
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
    
    console.log('[addSelectedGame] Sending data:', { gameId, copyCount, gameSize, allocatedTables });
    
    if (!r || !gameId) return;
    
    // Vérifier que le nombre de tables allouées ne dépasse pas les tables restantes
    const remaining = this.getRemainingTables();
    if (allocatedTables > remaining) {
      alert(`Impossible d'allouer ${allocatedTables} table(s). Il ne reste que ${remaining} table(s) disponible(s) sur cette réservation.`);
      return;
    }
    
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

  removeGameFromReservation(festivalGameId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu de la réservation ?')) {
      return;
    }
    this.isLoading.set(true);
    this.reservationService.removeGame(festivalGameId).subscribe({
      next: () => {
        this.refreshReservation();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Erreur suppression jeu:', err);
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

  // Tables restantes à allouer (réservées - allouées)
  getRemainingTables(): number {
    return this.getTotalTables() - this.getTotalAllocatedTables();
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

  // Vérifier si une zone est valide pour un jeu (doit appartenir au même festival)
  isZoneValidForGame(mapZone: MapZone): boolean {
    const r = this.reservation();
    if (!r?.festival_id) return false;
    
    // Vérifier que la zone de plan appartient au même festival que la réservation
    return mapZone.festival_id === r.festival_id;
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

  // Vérifier que le nombre de tables demandées ne dépasse pas les limites de la zone
  private checkTableLimits(festivalGame: FestivalGame, mapZoneId: number): boolean {
    const r = this.reservation();
    const mapZone = this.availableMapZones().find(z => z.id === mapZoneId);
    
    if (!r || !mapZone) return false;

    // Obtenir le type de table sélectionné
    const tableSize = this.selectedTableSize();
    
    // Compter les tables déjà placées dans cette zone (du même type)
    const tablesAlreadyInZone = (r.games || [])
      .filter((g: FestivalGame) => g.map_zone_id === mapZoneId && g.id !== festivalGame.id && g.table_size === tableSize)
      .reduce((sum: number, g: FestivalGame) => sum + (g.allocated_tables || 0), 0);

    // Récupérer le nombre de tables disponibles dans la MapZone selon le type
    let maxTables = 0;
    switch (tableSize) {
      case 'STANDARD':
        maxTables = mapZone.small_tables || 0;
        break;
      case 'LARGE':
        maxTables = mapZone.large_tables || 0;
        break;
      case 'CITY':
        maxTables = mapZone.city_tables || 0;
        break;
    }

    const newTotal = tablesAlreadyInZone + (festivalGame.allocated_tables || 1);
    
    return newTotal <= maxTables;
  }

  // Obtenir un résumé des tables utilisées par MapZone
  getZoneUsageSummary(): { zoneName: string; used: number; max: number; priceZoneId: number }[] {
    const r = this.reservation();
    const mapZones = this.availableMapZones();
    if (!r?.games || mapZones.length === 0) return [];

    return mapZones.map(mapZone => {
      // Calculer le max et used à partir des TableTypes
      let max = 0;
      let usedByOthers = 0;
      
      if (mapZone.tableTypes && mapZone.tableTypes.length > 0) {
        for (const tt of mapZone.tableTypes) {
          max += tt.nb_total;
          // nb_total - nb_available = tables utilisées par TOUTES les réservations
          usedByOthers += (tt.nb_total - tt.nb_available);
        }
      } else {
        max = (mapZone.small_tables || 0) + (mapZone.large_tables || 0) + (mapZone.city_tables || 0);
      }

      // Ajouter les tables de la réservation courante qui sont dans cette zone
      // (car elles comptent déjà dans usedByOthers depuis le backend)
      const usedByCurrentReservation = (r.games || [])
        .filter((g: FestivalGame) => g.map_zone_id === mapZone.id)
        .reduce((sum: number, g: FestivalGame) => sum + (g.allocated_tables || 0), 0);

      // Le total utilisé est ce qui est marqué comme utilisé dans le backend
      // Si la réservation courante a déjà des jeux placés, ils sont déjà comptés
      const used = usedByOthers;

      return {
        zoneName: mapZone.name,
        used,
        max,
        priceZoneId: mapZone.price_zone_id
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

  // Obtenir le nombre de tables disponibles par type pour la zone sélectionnée
  getAvailableTablesForType(tableType: string): number {
    const zoneId = this.selectedMapZoneId();
    if (!zoneId) return 0;
    
    const zone = this.availableMapZones().find(z => z.id === zoneId);
    if (!zone) return 0;
    
    if (zone.tableTypes && zone.tableTypes.length > 0) {
      const tt = zone.tableTypes.find(t => t.name === tableType);
      return tt ? tt.nb_available : 0;
    }
    
    // Fallback sur les anciens champs
    switch (tableType) {
      case 'STANDARD': return zone.small_tables || 0;
      case 'LARGE': return zone.large_tables || 0;
      case 'CITY': return zone.city_tables || 0;
      default: return 0;
    }
  }

  // Compte de jeux placés
  getPlacedGamesCount(): number {
    const r = this.reservation();
    if (!r?.games) return 0;
    return r.games.filter((g: FestivalGame) => g.map_zone_id !== null && g.map_zone_id !== undefined).length;
  }
}