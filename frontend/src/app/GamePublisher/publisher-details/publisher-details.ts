import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GamePubListService } from '../service/game-pub-list-service';
import { GameListService } from '../../Game/service/game-list-service';
import { GamePublisherDto } from '../../types/game-publisher-dto';
import { GameDto } from '../../types/game-dto';
import { GameForm } from '../../Game/game-form/game-form';
import { GameCard } from '../../Game/game-card/game-card';

@Component({
  selector: 'app-publisher-details',
  standalone: true,
  imports: [GameForm, GameCard],
  templateUrl: './publisher-details.html',
  styleUrl: './publisher-details.css'
})
export class PublisherDetails {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly pubService = inject(GamePubListService)
  private readonly gameService = inject(GameListService)

  publisherId = signal<number | null>(null)
  showForm = signal(false)
  selectedGameId = signal<number | null>(null)

  publisher = computed<GamePublisherDto | null>(() => { // Éditeur sélectionné
    const id = this.publisherId()
    if (id === null) return null
    return this.pubService.findGamePubById(id) ?? null
  })

  // Tous les jeux (signal readonly du service)
  readonly games = this.gameService.games

  // Jeux appartenant à cet éditeur (filtrage par pubId)
  publisherGames = computed<GameDto[]>(() => {
    const pub = this.publisher()
    if (!pub) return []
    return this.games().filter(g => g.publisherId === pub.id)
  })

  // Le jeu en cours d'édition
  editingGame = computed<GameDto | null>(() => {
    const id = this.selectedGameId()
    if (id === null) return null
    return this.gameService.findGameById(id) ?? null
  })

  constructor(){
    this.route.paramMap.subscribe(pm => {
      const idParam = pm.get('id')
      this.publisherId.set(idParam ? Number(idParam) : null)
    })
  }

  toggleForm(){
    this.showForm.update(s => !s)
    if (!this.showForm()) {
      this.selectedGameId.set(null)
    }
  }

  onNewGame(game: Omit<GameDto,'id'>): void {
    // Plus besoin de forcer pubId, déjà correct si formulaire prérempli
    this.gameService.onNewGame(game)
    this.showForm.set(false)
    this.selectedGameId.set(null)
  }

  onUpdateGame(data: {id: number, game: Omit<GameDto,'id'>}): void {
    this.gameService.updateGame(data.id, data.game)
    this.showForm.set(false)
    this.selectedGameId.set(null)
  }

  onEdit(id: number): void {
    this.selectedGameId.set(id)
    this.showForm.set(true)
  }

  onDelete(id: number): void {
    this.gameService.onDeleteGame(id)
    if (this.selectedGameId() === id) {
      this.selectedGameId.set(null)
    }
  }
  goToGame(id: number): void {
    this.router.navigate(['/game', id])
  }

  back(): void {
    this.router.navigate(['/publishers'])
  }
}
