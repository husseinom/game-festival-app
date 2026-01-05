import { Component, inject, signal, computed } from '@angular/core';
import { ReservantService } from '../services/reservant-service';
import { ReservantCard } from '../reservant-card/reservant-card';
import { ReservantForm } from '../reservant-form/reservant-form';

@Component({
  selector: 'app-reservant-list',
  standalone: true,
  imports: [ReservantCard, ReservantForm],
  templateUrl: './reservant-list.html',
  styleUrl: './reservant-list.css',
})
export class ReservantList {
  private readonly reservantService = inject(ReservantService);

  readonly reservants = this.reservantService.reservants;
  readonly isLoading = this.reservantService.isLoading;
  readonly error = this.reservantService.error;

  showForm = signal(false);
  reservantCount = computed(() => this.reservants().length);

  constructor() {
    this.reservantService.getReservants();
  }

  toggleForm() {
    this.showForm.update(s => !s);
  }

  onReservantCreated() {
    this.showForm.set(false);
  }

  onUpdateType(data: { reservantId: number; type: string }) {
    this.reservantService.onUpdateReservant(data.reservantId, data.type);
  }

  onDeleteReservant(reservantId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce réservant ?')) {
      this.reservantService.onDeleteReservant(reservantId);
    }
  }

  refreshReservants() {
    this.reservantService.getReservants();
  }
}
