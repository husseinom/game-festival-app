import { Component, input, output } from '@angular/core';
import { PriceZone } from '../../types/price-zone';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-price-zone-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './price-zone-card.html',
  styleUrl: './price-zone-card.css',
})
export class PriceZoneCard {
  public pz = input<PriceZone | null>(null);

  card = output<number>();
  // edit = output<number>();
  isSelected = input<boolean>(false);

  onCardClick(event?: Event): void {
    // Card click -> show details
    event?.stopPropagation();
    const g = this.pz();
    if (g && g.id !== null) {
      this.card.emit(g.id);
    }
  }

  // onEditClick(event: Event): void {
  //   // Edit button -> open form
  //   event.stopPropagation();
  //   const g = this.game();
  //   if (g && g.id !== null) {
  //     this.edit.emit(g.id);
  //   }
  // }
}
