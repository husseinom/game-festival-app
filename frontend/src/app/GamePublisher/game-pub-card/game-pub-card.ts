import { Component, input, output,computed } from '@angular/core';
import { GamePublisherDto } from '../../types/game-publisher-dto';
import { GameDto } from '../../types/game-dto';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-game-pub-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './game-pub-card.html',
  styleUrl: './game-pub-card.css'
})
export class GamePubCard {
  public gamePub = input<GamePublisherDto | null>(null);
  public games = input<GameDto[]>([]);

  remove = output<number>(); 
  card = output<number>();

  isSelected = input<boolean>(false);

  gameCount = computed(() => {
    const gp = this.gamePub();
    const list = this.games ? this.games() : [];
    if (gp) {
      return list.filter(g => g.game_publisher_id === gp.id).length;
    }
    return null;
  });


  onRemove(event: Event): void {
    event.stopPropagation();
    const gp = this.gamePub();
    if (gp && gp.id !==null) {
      this.remove.emit(gp.id);
    }
  }
  
  onCardClick(): void {
    const gp = this.gamePub();
    if (gp && gp.id !== null) {
      this.card.emit(gp.id);
    }
  }


 
  

}
