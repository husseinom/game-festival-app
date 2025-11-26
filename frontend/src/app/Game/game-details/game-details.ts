import { Component,inject,signal,computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameListService } from '../service/game-list-service';
import { GamePubListService } from '../../GamePublisher/service/game-pub-list-service';
import { GameDto } from '../../types/game-dto';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-details',
  standalone: true,
  imports: [],
  templateUrl: './game-details.html',
  styleUrl: './game-details.css'
})
export class GameDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly gamesService = inject(GameListService);
  private readonly pubService = inject(GamePubListService);

  private readonly gameId = signal<number | null>(null);

  location = inject(Location);
  router = inject(Router);

  // jeu sélectionné (null si introuvable)
  game = computed<GameDto | null>(() => {
    const id = this.gameId();
    if (id === null) return null;
    return this.gamesService.findGameById(id) ?? null;
  });

  // Éditeur du jeu (computed depuis pubId)
  publisher = computed(() => {
    const g = this.game();
    return g ? this.pubService.findGamePubById(g.pubId) : null;
  });

  constructor() {
    // lit l'id depuis l'URL
    this.route.paramMap.subscribe(pm => {
      const idParam = pm.get('id');
      this.gameId.set(idParam ? Number(idParam) : null);
    });
  }

   goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    }
    else{
      this.router.navigate(['/games'])
    }
  }

}
