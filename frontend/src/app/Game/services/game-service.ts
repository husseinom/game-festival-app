import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { GameDto } from '../../types/game-dto';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly http = inject(HttpClient);

  /**
   * Récupère tous les jeux d'un éditeur
   */
  getGamesByPublisher(publisherId: number): Observable<GameDto[]> {
    return this.http.get<GameDto[]>(
      `${environment.apiUrl}/games/publisher/${publisherId}`,
      { withCredentials: true }
    );
  }

  /**
   * Récupère un jeu par son ID
   */
  getGameById(id: number): Observable<GameDto> {
    return this.http.get<GameDto>(
      `${environment.apiUrl}/games/${id}`,
      { withCredentials: true }
    );
  }

  /**
   * Récupère tous les jeux
   */
  getAllGames(): Observable<GameDto[]> {
    return this.http.get<GameDto[]>(
      `${environment.apiUrl}/games/all`,
      { withCredentials: true }
    );
  }
}
