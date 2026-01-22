import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { 
  Reservation, 
  ReservationStatus, 
  InvoiceStatus,
  RESERVATION_STATUS_LABELS,
  INVOICE_STATUS_LABELS 
} from '../../types/reservation';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './reservation-card.html',
  styleUrls: ['./reservation-card.css']
})
export class ReservationCard {
  private readonly router = inject(Router);
  
  @Input() reservation!: Reservation;
  @Output() delete = new EventEmitter<number>();
  @Output() statusChange = new EventEmitter<{ id: number; status: ReservationStatus }>();
  @Output() invoiceAction = new EventEmitter<{ id: number; action: 'invoice' | 'paid' }>();

  get totalTables(): number {
    return this.reservation.zones?.reduce((acc, z) => acc + z.table_count, 0) || 0;
  }
  
  get statusLabel(): string {
    return RESERVATION_STATUS_LABELS[this.reservation.status] || this.reservation.status;
  }
  
  get invoiceStatusLabel(): string {
    return INVOICE_STATUS_LABELS[this.reservation.invoice_status] || this.reservation.invoice_status;
  }

  getStatusClass(): string {
    const status = this.reservation.status;
    switch (status) {
      case 'CONFIRMED': return 'status-confirmed';
      case 'IN_DISCUSSION': return 'status-discussion';
      case 'CONTACTED': return 'status-contacted';
      case 'NOT_CONTACTED': return 'status-not-contacted';
      case 'ABSENT': 
      case 'CONSIDERED_ABSENT': return 'status-absent';
      default: return 'status-default';
    }
  }
  
  getInvoiceClass(): string {
    switch (this.reservation.invoice_status) {
      case 'PAID': return 'invoice-paid';
      case 'INVOICED': return 'invoice-invoiced';
      default: return 'invoice-pending';
    }
  }

  onCardClick(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/reservation', this.reservation.reservation_id]);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    // Just emit - dialog is handled in parent (reservation-list)
    this.delete.emit(this.reservation.reservation_id);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/reservation', this.reservation.reservation_id, 'edit']);
  }
  
  onMarkInvoiced(event: Event): void {
    event.stopPropagation();
    this.invoiceAction.emit({ id: this.reservation.reservation_id, action: 'invoice' });
  }
  
  onMarkPaid(event: Event): void {
    event.stopPropagation();
    this.invoiceAction.emit({ id: this.reservation.reservation_id, action: 'paid' });
  }
}