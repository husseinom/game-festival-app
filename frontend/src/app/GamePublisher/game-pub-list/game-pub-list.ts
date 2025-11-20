import { Component } from '@angular/core';
import { inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { GamePubListService } from '../service/game-pub-list-service';
import { GamePublisherDto } from '../../types/game-publisher-dto';

@Component({
  selector: 'app-game-pub-list',
  standalone: true,
  imports: [],
  templateUrl: './game-pub-list.html',
  styleUrl: './game-pub-list.css'
})
export class GamePubList {
  private readonly gls = inject(GamePubListService)
  readonly gamePubs = this.gls.gamePubs
  router = inject(Router)
  showForm = signal(false)

  // Signaux pour la sélection/édition
  selectedId = signal<number | null>(null)
  selectedGamePub = signal<GamePublisherDto | null>(null)

  gamePubCount = computed(() => this.gamePubs().length)

  constructor(){
    // Effect pour mettre à jour selectedGamePub quand selectedId change
    effect(() => {
      const id = this.selectedId();
      if (id !== null) {
        const gamePub = this.gls.findGamePubById(id);
        this.selectedGamePub.set(gamePub || null);
      } else {
        this.selectedGamePub.set(null);
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

  onNewGamePub(gamePub: Omit<GamePublisherDto,'id'>): void {
    this.gls.onNewGamePub(gamePub)
    this.showForm.set(false)
    this.selectedId.set(null)
  }

  onUpdateGame(data: {id: number, gamePub: Omit<GamePublisherDto,'id'>}): void {
    this.gls.updateGamePub(data.id, data.gamePub)
    this.showForm.set(false)
    this.selectedId.set(null)
  }

  onEdit(id: number): void {
    this.selectedId.set(id)
    this.showForm.set(true)
  }
  
  onDelete(id: number): void {
    this.gls.onDeleteGamePub(id)
    if (this.selectedId() === id) {
      this.selectedId.set(null)
    }
  }

  goToGames(id: number){
    this.router.navigate(['/game', id])
  }
  
}
