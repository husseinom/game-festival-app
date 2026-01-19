import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Reservation } from '../../types/reservation';

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

  get totalTables(): number {
    return this.reservation.zones?.reduce((acc, z) => acc + z.table_count, 0) || 0;
  }

  getStatusClass(): string {
    switch (this.reservation.status) {
      case 'Confirmé': return 'status-badge confirmed';
      case 'Facturé': return 'status-badge invoiced';
      case 'En discussion': return 'status-badge discussion';
      default: return 'status-badge default';
    }
  }

  onCardClick(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/reservation', this.reservation.reservation_id]);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.reservation.reservation_id);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    console.log('Edit clicked for reservation', this.reservation.reservation_id);
  }
}