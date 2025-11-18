import { Injectable,signal,WritableSignal} from '@angular/core';
import { GameDto } from '../../types/game-dto';

@Injectable({
  providedIn: 'root'
})
export class GameListService {
  private readonly _games : WritableSignal<GameDto[]>;

  games = this._games.asReadonly();

  nextId = 1;

  onNewGame(game: Omit<GameDto,'id'>): void {
    
  }



  


  
}
