import { Component, inject, signal, computed } from '@angular/core';
import { ReservantService } from '../services/reservant-service';
import { ReservantCard } from '../reservant-card/reservant-card';
import { ReservantForm } from '../reservant-form/reservant-form';
import { Reservant } from '../../types/reservant';

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
  editingReservant = signal<Reservant | null>(null);
  reservantCount = computed(() => this.reservants().length);

  constructor() {
    this.reservantService.getReservants();
  }

  trackByReservantId(index: number, reservant: Reservant): number {
    return reservant.reservant_id;
  }

  toggleForm() {
    this.editingReservant.set(null);
    this.showForm.update(isVisible => !isVisible);
  }

  onReservantSaved() {
    this.showForm.set(false);
    this.editingReservant.set(null);
  }

  startEdit(reservant: Reservant) {
    this.editingReservant.set(reservant);
    this.showForm.set(true);
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
