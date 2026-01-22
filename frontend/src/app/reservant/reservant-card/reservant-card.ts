import { Component, input, output, computed } from '@angular/core';
import { Reservant } from '../../types/reservant';

@Component({
  selector: 'app-reservant-card',
  standalone: true,
  imports: [],
  templateUrl: './reservant-card.html',
  styleUrl: './reservant-card.css',
})
export class ReservantCard {
  reservant = input.required<Reservant>();
  
  editRequested = output<Reservant>();
  deleteRequested = output<number>();

  typeClass = computed(() => this.normalizeType(this.reservant().type));

  private normalizeType(type: string | undefined): string {
    if (!type) return '';
    const normalized = type
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s/]/g, '-');
    return `badge-${normalized}`;
  }

  onEdit() {
    this.editRequested.emit(this.reservant());
  }

  onDelete() {
    this.deleteRequested.emit(this.reservant().reservant_id);
  }
}
