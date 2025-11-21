import { Component } from '@angular/core';
import { inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { GamePubListService } from '../service/game-pub-list-service';
import { GamePublisherDto } from '../../types/game-publisher-dto';
import { PublisherForm } from '../Form/publisher-form/publisher-form';
import { GamePubCard } from '../game-pub-card/game-pub-card';
import { GameListService } from '../../Game/service/game-list-service';

@Component({
  selector: 'app-game-pub-list',
  standalone: true,
  imports: [PublisherForm, GamePubCard],
  templateUrl: './game-pub-list.html',
  styleUrl: './game-pub-list.css'
})
export class GamePubList {
  private readonly gls = inject(GamePubListService)
  readonly gamePubs = this.gls.gamePubs
  private readonly gm = inject(GameListService)
  readonly games = this.gm.games
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

  onUpdatePublisher(data: {id: number, publisher: Omit<GamePublisherDto,'id'>}): void {
    this.gls.updateGamePub(data.id, data.publisher)
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
    this.router.navigate(['/publisher', id])
  }
  
}
