import { Component, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../services/reservation.service';
import { Location, CommonModule } from '@angular/common';
import { Reservation } from '../../types/reservation';
import { toSignal } from '@angular/core/rxjs-interop'; // Requis
import { map, switchMap, filter } from 'rxjs';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.css'
})
export class ReservationDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly reservationService = inject(ReservationService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  private readonly id$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    filter((id): id is string => id !== null),
    map(id => Number(id))
  );

  readonly reservation = toSignal(
    this.id$.pipe(
      switchMap(id => this.reservationService.getById(id))
    ),
    { initialValue: null }
  );

  readonly publisher = computed(() => this.reservation()?.publisher ?? null);

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/reservations']);
    }
  }

  getStatusLabel(status?: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'cancelled': 'Annulée',
      'completed': 'Complétée'
    };
    return status ? statusMap[status] || status : 'Non défini';
  }
}