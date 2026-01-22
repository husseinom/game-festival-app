import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../services/reservation.service';
import { 
  Reservation, 
  CreateReservationDTO, 
  ReservationStatus, 
  InvoiceStatus,
  RESERVATION_STATUS_LABELS,
  INVOICE_STATUS_LABELS 
} from '../../types/reservation';
import { ReservationCard } from '../reservation-card/reservation-card';
import { ReservationForm } from '../reservation-form/reservation-form';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog-data/confirm-dialog-data';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, ReservationCard, ReservationForm], 
  templateUrl: './reservation-list.html',
  styleUrls: ['./reservation-list.css']
})
export class ReservationList implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  reservations = signal<Reservation[]>([]);
  isLoading = signal(true);
  showForm = signal(false);
  
  // Sélection multiple
  selectedIds = signal<Set<number>>(new Set());
  selectAll = signal(false);
  
  // Filtres
  statusFilter = signal<ReservationStatus | 'ALL'>('ALL');
  invoiceFilter = signal<InvoiceStatus | 'ALL'>('ALL');
  
  // Labels pour les selects
  readonly statusOptions: { value: ReservationStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'NOT_CONTACTED', label: RESERVATION_STATUS_LABELS['NOT_CONTACTED'] },
    { value: 'CONTACTED', label: RESERVATION_STATUS_LABELS['CONTACTED'] },
    { value: 'IN_DISCUSSION', label: RESERVATION_STATUS_LABELS['IN_DISCUSSION'] },
    { value: 'CONFIRMED', label: RESERVATION_STATUS_LABELS['CONFIRMED'] },
    { value: 'ABSENT', label: RESERVATION_STATUS_LABELS['ABSENT'] },
    { value: 'CONSIDERED_ABSENT', label: RESERVATION_STATUS_LABELS['CONSIDERED_ABSENT'] }
  ];
  
  readonly invoiceOptions: { value: InvoiceStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Toutes factures' },
    { value: 'PENDING', label: INVOICE_STATUS_LABELS['PENDING'] },
    { value: 'INVOICED', label: INVOICE_STATUS_LABELS['INVOICED'] },
    { value: 'PAID', label: INVOICE_STATUS_LABELS['PAID'] }
  ];
  
  // Réservations filtrées
  filteredReservations = computed(() => {
    let list = this.reservations();
    
    if (this.statusFilter() !== 'ALL') {
      list = list.filter(r => r.status === this.statusFilter());
    }
    
    if (this.invoiceFilter() !== 'ALL') {
      list = list.filter(r => r.invoice_status === this.invoiceFilter());
    }
    
    return list;
  });
  
  // Nombre sélectionné
  selectedCount = computed(() => this.selectedIds().size);
  hasSelection = computed(() => this.selectedIds().size > 0);

  ngOnInit(): void {
    this.loadReservations();
  }
  
  loadReservations(): void {
    this.isLoading.set(true);
    this.reservationService.getAll().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.isLoading.set(false);
      }
    });
  }

  onReservationClick(id: number): void {
    this.router.navigate(['/reservation', id]);
  }

  // Handlers pour les filtres sans ngModel
  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as ReservationStatus | 'ALL');
  }

  onInvoiceFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.invoiceFilter.set(target.value as InvoiceStatus | 'ALL');
  }

  toggleForm(): void {
    this.showForm.update(value => !value);
  }

  closeForm(): void {
    this.showForm.set(false);
  }
  
  // ============================================
  // Sélection multiple
  // ============================================
  
  toggleSelection(id: number): void {
    const newSet = new Set(this.selectedIds());
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    this.selectedIds.set(newSet);
  }
  
  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }
  
  toggleSelectAll(): void {
    if (this.selectAll()) {
      this.selectedIds.set(new Set());
      this.selectAll.set(false);
    } else {
      const allIds = this.filteredReservations().map(r => r.reservation_id);
      this.selectedIds.set(new Set(allIds));
      this.selectAll.set(true);
    }
  }
  
  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.selectAll.set(false);
  }
  
  // ============================================
  // Actions en masse
  // ============================================
  
  batchUpdateStatus(status: ReservationStatus): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer la mise à jour',
      message: `Êtes-vous sûr de vouloir changer le statut de ${ids.length} réservation(s) vers "${RESERVATION_STATUS_LABELS[status]}" ?`,
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.reservationService.updateStatusBatch(ids, status).subscribe({
          next: (response) => {
            this.updateReservationsInList(response.data);
            this.clearSelection();
          },
          error: (err) => console.error('Erreur mise à jour statut:', err)
        });
      }
    });
  }
  
  batchUpdateInvoiceStatus(invoiceStatus: InvoiceStatus): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer la mise à jour',
      message: `Êtes-vous sûr de vouloir changer le statut de facturation de ${ids.length} réservation(s) vers "${INVOICE_STATUS_LABELS[invoiceStatus]}" ?`,
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.reservationService.updateInvoiceStatusBatch(ids, invoiceStatus).subscribe({
          next: (response) => {
            this.updateReservationsInList(response.data);
            this.clearSelection();
          },
          error: (err) => console.error('Erreur mise à jour facturation:', err)
        });
      }
    });
  }
  
  private updateReservationsInList(updated: Reservation[]): void {
    const updatedMap = new Map(updated.map(r => [r.reservation_id, r]));
    this.reservations.update(list => 
      list.map(r => updatedMap.get(r.reservation_id) || r)
    );
  }

  // ============================================
  // CRUD
  // ============================================

  onNewReservation(data: CreateReservationDTO): void {
    this.reservationService.create(data).subscribe({
      next: (response) => {
        this.reservations.update(list => [response.data, ...list]);
        this.closeForm();
      },
      error: (err) => console.error('Erreur création:', err)
    });
  }

  onDeleteReservation(id: number): void {
    const reservation = this.reservations().find(r => r.reservation_id === id);
    if (!reservation) return;

    // Get first zone's name if available
    const zoneName = reservation.zones?.[0]?.priceZone?.name || 'N/A';

    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer la réservation ?\n\nRéservant: ${reservation.reservant?.name || 'N/A'}\nZone: ${zoneName}\n\n⚠️ Les tables seront libérées.\n⚠️ Cette action est irréversible !`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.reservationService.delete(id).subscribe({
          next: () => {
            this.reservations.update(list => list.filter(r => r.reservation_id !== id));
          },
          error: (err) => console.error('Erreur suppression:', err)
        });
      }
    });
  }
  
  // Actions rapides depuis la liste
  onStatusChange(id: number, status: ReservationStatus): void {
    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer le changement',
      message: `Changer le statut de la réservation vers "${RESERVATION_STATUS_LABELS[status]}" ?`,
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.reservationService.updateStatus(id, status).subscribe({
          next: (response) => {
            this.reservations.update(list => 
              list.map(r => r.reservation_id === id ? response.data : r)
            );
          },
          error: (err) => console.error('Erreur mise à jour:', err)
        });
      }
    });
  }
  
  onInvoiceAction(id: number, action: 'invoice' | 'paid'): void {
    const actionLabel = action === 'invoice' ? 'facturée' : 'payée';
    
    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer l\'action',
      message: `Marquer la réservation comme ${actionLabel} ?`,
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const obs = action === 'invoice' 
          ? this.reservationService.markAsInvoiced(id)
          : this.reservationService.markAsPaid(id);
          
        obs.subscribe({
          next: (response) => {
            this.reservations.update(list => 
              list.map(r => r.reservation_id === id ? response.data : r)
            );
          },
          error: (err) => console.error('Erreur facturation:', err)
        });
      }
    });
  }
}