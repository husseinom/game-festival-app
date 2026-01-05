import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Reservant } from '../../types/reservant';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-reservant-card',
  standalone: true,
  imports: [NgClass, FormsModule],
  templateUrl: './reservant-card.html',
  styleUrl: './reservant-card.css',
})
export class ReservantCard {
  reservant = input.required<Reservant>();
  
  typeChanged = output<{ reservantId: number; type: string }>();
  deleteRequested = output<number>();

  readonly types: { value: string; label: string }[] = [
    { value: 'Éditeur', label: 'Éditeur' },
    { value: 'Prestataire', label: 'Prestataire' },
    { value: 'Boutique', label: 'Boutique' },
    { value: 'Association', label: 'Association' },
    { value: 'Animation / Zone Proto', label: 'Animation / Zone Proto' }
  ];

  getTypeClass(type: string | undefined): string {
    if (!type) return '';
    return `badge-${type.toLowerCase().replace(/[\s/]/g, '-')}`;
  }

  onTypeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newType = select.value;
    this.typeChanged.emit({ reservantId: this.reservant().reservant_id, type: newType });
  }

  onDelete() {
    this.deleteRequested.emit(this.reservant().reservant_id);
  }
}
