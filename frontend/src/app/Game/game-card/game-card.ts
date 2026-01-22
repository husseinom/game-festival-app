import { Component, inject, input, output } from '@angular/core';
import { GameDto } from '../../types/game-dto';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoleService } from '../../shared/services/role.service';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './game-card.html',
  styleUrl: './game-card.css'
})
export class GameCard {
  private readonly roleService = inject(RoleService);
  
  public game = input<GameDto | null>(null);
  readonly canEdit = this.roleService.canEditGames;

  remove = output<number>();

  card = output<number>();
  edit = output<number>();

  isSelected = input<boolean>(false);

  onRemove(event:Event): void {
    event.stopPropagation();
    const g = this.game();
    if (g && g.id !==null) {
      this.remove.emit(g.id);
    }
  }

  onCardClick(event?: Event): void {
    // Card click -> show details
    event?.stopPropagation();
    const g = this.game();
    if (g && g.id !== null) {
      this.card.emit(g.id);
    }
  }

  onEditClick(event: Event): void {
    // Edit button -> open form
    event.stopPropagation();
    const g = this.game();
    if (g && g.id !== null) {
      this.edit.emit(g.id);
    }
  }
}
