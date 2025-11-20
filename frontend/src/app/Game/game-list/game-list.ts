import { Component } from '@angular/core';
import { inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { GameListService } from '../service/game-list-service';
import { GameDto } from '../../types/game-dto';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [],
  templateUrl: './game-list.html',
  styleUrl: './game-list.css'
})
export class GameList {
  private readonly gls = inject(GameListService)
  readonly games = this.gls.games
  router = inject(Router)
  showForm = signal(false)

  // Signaux pour la sélection/édition
  selectedId = signal<number | null>(null)
  selectedGame = signal<GameDto | null>(null)

  gameCount = computed(() => this.games().length)

  constructor(){
    // Effect pour mettre à jour selectedGame quand selectedId change
    effect(() => {
      const id = this.selectedId();
      if (id !== null) {
        const game = this.gls.findGameById(id);
        this.selectedGame.set(game || null);
      } else {
        this.selectedGame.set(null);
      }
    })
  }

  toggleForm(){
    this.showForm.update(s => !s)
    // Réinitialiser la sélection quand on ferme le formulaire
    if (!this.showForm()) {
      this.selectedId.set(null);
    }
  }

  onNewGame(game: Omit<GameDto,'id'>): void {
    this.gls.onNewGame(game)
    this.showForm.set(false)
    this.selectedId.set(null)
  }

  onUpdateGame(data: {id: number, game: Omit<GameDto,'id'>}): void {
    this.gls.updateGame(data.id, data.game)
    this.showForm.set(false)
    this.selectedId.set(null)
  }

  onEdit(id: number): void {
    this.selectedId.set(id)
    this.showForm.set(true)
  }
  
  onDelete(id: number): void {
    const game = this.gls.findGameById(id)
    this.gls.onDeleteGame(id)
    if (this.selectedId() === id) {
      this.selectedId.set(null)
    }
  }

  goToGame(id: number){
    this.router.navigate(['/game', id])
  }


}
