import { Component } from '@angular/core';
import { inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GamePubListService } from '../service/game-pub-list-service';
import { GamePublisherDto } from '../../types/game-publisher-dto';
import { PublisherForm } from '../publisher-form/publisher-form';
import { GamePubCard } from '../game-pub-card/game-pub-card';
import { GameListService } from '../../Game/service/game-list-service';
import { RoleService } from '../../shared/services/role.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog-data/confirm-dialog-data';

@Component({
  selector: 'app-game-pub-list',
  standalone: true,
  imports: [PublisherForm, GamePubCard, FormsModule],
  templateUrl: './game-pub-list.html',
  styleUrl: './game-pub-list.css'
})
export class GamePubList {
  readonly gls = inject(GamePubListService);
  readonly allGamePubs = this.gls.gamePubs;
  private readonly gm = inject(GameListService);
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(MatDialog);
  readonly games = this.gm.games;
  router = inject(Router);
  showForm = signal(false);

  readonly canEdit = this.roleService.canEditPublishers;

  // Filtres
  searchQuery = signal('');
  selectedFilter = signal<string>('');

  // Éditeurs filtrés
  gamePubs = computed(() => {
    let filtered = this.allGamePubs();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.selectedFilter();

    if (query) {
      filtered = filtered.filter((pub: GamePublisherDto) => 
        pub.name.toLowerCase().includes(query)
      );
    }

    if (filter === 'exposant') {
      filtered = filtered.filter((pub: GamePublisherDto) => pub.exposant);
    } else if (filter === 'distributeur') {
      filtered = filtered.filter((pub: GamePublisherDto) => pub.distributeur);
    }

    return filtered;
  });

  selectedId = signal<number | null>(null);
  selectedGamePub = signal<GamePublisherDto | null>(null);

  gamePubCount = computed(() => this.gamePubs().length);
  totalCount = computed(() => this.allGamePubs().length);

  constructor(){
    this.gm.getGames();
    this.gls.getGamePubs();
    
    effect(() => {
      const id = this.selectedId();
      if (id !== null) {
        const gamePub = this.gls.findGamePubById(id);
        this.selectedGamePub.set(gamePub || null);
      } else {
        this.selectedGamePub.set(null);
      }
    });
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedFilter.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedFilter.set('');
  }

  toggleForm(){
    this.showForm.update((s: boolean) => !s);
    if (!this.showForm()) {
      this.selectedId.set(null);
    }
  }

  onNewGamePub(gamePub: Omit<GamePublisherDto,'id'>): void {
    this.gls.onNewGamePub(gamePub);
    this.showForm.set(false);
    this.selectedId.set(null);
  }

  onUpdatePublisher(data: {id: number, publisher: Omit<GamePublisherDto,'id'>}): void {
    this.gls.updateGamePub(data.id, data.publisher);
    this.showForm.set(false);
    this.selectedId.set(null);
  }

  onEdit(id: number): void {
    this.selectedId.set(id);
    this.showForm.set(true);
  }
  
  onDelete(id: number): void {
    const publisher = this.gls.findGamePubById(id);
    if (!publisher) return;

    const gameCount = this.games().filter(g => g.publisherId === id).length;
    const hasGames = gameCount > 0;

    const message = hasGames
      ? `Êtes-vous sûr de vouloir supprimer l'éditeur "${publisher.name}" ?\n\n⚠️ Cet éditeur a ${gameCount} jeu(x) associé(s).\n⚠️ Les jeux ne seront pas supprimés mais n'auront plus d'éditeur.\n\n⚠️ Cette action est irréversible !`
      : `Êtes-vous sûr de vouloir supprimer l'éditeur "${publisher.name}" ?\n\n⚠️ Cette action est irréversible !`;

    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer la suppression',
      message: message,
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.gls.onDeleteGamePub(id);
        if (this.selectedId() === id) {
          this.selectedId.set(null);
        }
      }
    });
  }

  goToGames(id: number){
    this.router.navigate(['/publisher', id]);
  }
}
