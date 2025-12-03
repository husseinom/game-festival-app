import { Component, input, output } from '@angular/core';
import { GameDto } from '../../types/game-dto';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './game-card.html',
  styleUrl: './game-card.css'
})
export class GameCard {
  public game = input<GameDto | null>(null);

  remove = output<number>();

  card = output<number>();

  isSelected = input<boolean>(false);

  onRemove(event:Event): void {
    event.stopPropagation();
    const g = this.game();
    if (g && g.id !==null) {
      this.remove.emit(g.id);
    }
  }

  onCardClick(): void {
    const g = this.game();
    if (g && g.id !== null) {
      this.card.emit(g.id);
    }
  }





}
