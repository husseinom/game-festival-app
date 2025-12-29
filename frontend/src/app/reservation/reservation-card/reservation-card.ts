import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Reservation } from '../../types/reservation';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './reservation-card.html',
  styleUrls: ['./reservation-card.css']
})
export class ReservationCard {
  @Input() reservation!: Reservation;

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
    // Handle card click if needed
  }
}