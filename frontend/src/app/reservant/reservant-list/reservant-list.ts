import { Component, inject, signal, computed } from '@angular/core';
import { ReservantService } from '../services/reservant-service';
import { ReservantCard } from '../reservant-card/reservant-card';
import { ReservantForm } from '../reservant-form/reservant-form';
import { Reservant } from '../../types/reservant';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog-data/confirm-dialog-data';

@Component({
  selector: 'app-reservant-list',
  standalone: true,
  imports: [ReservantCard, ReservantForm],
  templateUrl: './reservant-list.html',
  styleUrl: './reservant-list.css',
})
export class ReservantList {
  private readonly reservantService = inject(ReservantService);
  private readonly dialog = inject(MatDialog);

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
    const reservant = this.reservants().find(r => r.reservant_id === reservantId);
    if (!reservant) return;

    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le réservant "${reservant.name}" ?\n\n⚠️ Cette action supprimera également toutes ses réservations.\n⚠️ Cette action est irréversible !`,
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
        this.reservantService.onDeleteReservant(reservantId);
      }
    });
  }

  refreshReservants() {
    this.reservantService.getReservants();
  }
}
