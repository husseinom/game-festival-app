import { Component, OnInit, signal, computed } from '@angular/core';
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

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, ReservationCard, ReservationForm], 
  templateUrl: './reservation-list.html',
  styleUrls: ['./reservation-list.css']
})
export class ReservationList implements OnInit {
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

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) {}

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
    
    this.reservationService.updateStatusBatch(ids, status).subscribe({
      next: (response) => {
        this.updateReservationsInList(response.data);
        this.clearSelection();
      },
      error: (err) => console.error('Erreur mise à jour statut:', err)
    });
  }
  
  batchUpdateInvoiceStatus(invoiceStatus: InvoiceStatus): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    
    this.reservationService.updateInvoiceStatusBatch(ids, invoiceStatus).subscribe({
      next: (response) => {
        this.updateReservationsInList(response.data);
        this.clearSelection();
      },
      error: (err) => console.error('Erreur mise à jour facturation:', err)
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
    this.reservationService.delete(id).subscribe({
      next: () => {
        this.reservations.update(list => list.filter(r => r.reservation_id !== id));
      },
      error: (err) => console.error('Erreur suppression:', err)
    });
  }
  
  // Actions rapides depuis la liste
  onStatusChange(id: number, status: ReservationStatus): void {
    this.reservationService.updateStatus(id, status).subscribe({
      next: (response) => {
        this.reservations.update(list => 
          list.map(r => r.reservation_id === id ? response.data : r)
        );
      },
      error: (err) => console.error('Erreur mise à jour:', err)
    });
  }
  
  onInvoiceAction(id: number, action: 'invoice' | 'paid'): void {
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
}