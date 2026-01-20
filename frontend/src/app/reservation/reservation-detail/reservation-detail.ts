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
  FestivalGame
} from '../../types/reservation';
import { ReservantTypeLabelPipe } from '../../shared/pipes/reservant-type-label.pipe';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, filter, tap, BehaviorSubject } from 'rxjs';
import { GameDto } from '../../types/game-dto';
import { GameService } from '../../Game/services/game-service';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReservantTypeLabelPipe],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.css'
})
export class ReservationDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly reservationService = inject(ReservationService);
  private readonly gameService = inject(GameService);
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
  
  // États UI
  readonly isAddingGames = signal(false);
  readonly selectedGameId = signal<number | null>(null);
  readonly selectedCopyCount = signal(1);
  readonly isLoading = signal(false);

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
    }
  }

  addSelectedGame(): void {
    const r = this.reservation();
    const gameId = this.selectedGameId();
    const copyCount = this.selectedCopyCount();
    
    if (!r || !gameId) return;
    
    this.isLoading.set(true);
    this.reservationService.addGames(r.reservation_id, [{ game_id: gameId, copy_count: copyCount }]).subscribe({
      next: () => {
        this.refreshReservation();
        this.selectedGameId.set(null);
        this.selectedCopyCount.set(1);
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
}