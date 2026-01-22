import { Component } from '@angular/core';
import { inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameListService } from '../service/game-list-service';
import { GameDto } from '../../types/game-dto';
import { GameForm } from '../game-form/game-form';
import { GameCard } from '../game-card/game-card';
import { GamePubListService } from '../../GamePublisher/service/game-pub-list-service';
import { RoleService } from '../../shared/services/role.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog-data/confirm-dialog-data';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [GameForm, GameCard, FormsModule],
  templateUrl: './game-list.html',
  styleUrl: './game-list.css'
})
export class GameList {
  readonly gls = inject(GameListService);
  readonly allGames = this.gls.games;
  private readonly pubService = inject(GamePubListService);
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(MatDialog);
  publishers = this.pubService.gamePubs;
  router = inject(Router);
  showForm = signal(false);

  readonly canEdit = this.roleService.canEditGames;

  // Filtres
  searchQuery = signal('');
  selectedCategory = signal<string>('');

  // Types de jeux (catégories)
  gameTypes = this.gls.gameTypes;

  // Jeux filtrés
  games = computed(() => {
    let filtered = this.allGames();
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();

    // Filtre par nom
    if (query) {
      filtered = filtered.filter((game: GameDto) => 
        game.name.toLowerCase().includes(query) ||
        game.publisher?.name?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie
    if (category) {
      filtered = filtered.filter((game: GameDto) => game.type === category);
    }

    return filtered;
  });

  // Signaux pour la sélection/édition
  selectedId = signal<number | null>(null);
  selectedGame = signal<GameDto | null>(null);

  gameCount = computed(() => this.games().length);
  totalCount = computed(() => this.allGames().length);

  constructor(){
    this.gls.getGames();
    this.gls.getGameTypes();
    this.pubService.getGamePubs();
    
    effect(() => {
      const id = this.selectedId();
      if (id !== null) {
        const game = this.gls.findGameById(id);
        this.selectedGame.set(game || null);
      } else {
        this.selectedGame.set(null);
      }
    });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
  }

  toggleForm(){
    this.showForm.update((s: boolean) => !s);
    if (!this.showForm()) {
      this.selectedId.set(null);
    }
  }

  onNewGame(game: Omit<GameDto,'id'>): void {
    this.gls.onNewGame(game);
    this.showForm.set(false);
    this.selectedId.set(null);
  }

  onUpdateGame(data: {id: number, game: Omit<GameDto,'id'>}): void {
    this.gls.updateGame(data.id, data.game);
    this.showForm.set(false);
    this.selectedId.set(null);
  }

  onEdit(id: number): void {
    this.selectedId.set(id);
    this.showForm.set(true);
  }
  
  onDelete(id: number): void {
    const game = this.gls.findGameById(id);
    if (!game) return;

    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le jeu "${game.name}" ?\n\n⚠️ Cette action est irréversible !`,
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
        this.gls.onDeleteGame(id);
        if (this.selectedId() === id) {
          this.selectedId.set(null);
        }
      }
    });
  }

  goToGame(id: number){
    this.router.navigate(['/game', id]);
  }
}
