import { Injectable,signal,WritableSignal} from '@angular/core';
import { GameDto } from '../../types/game-dto';

@Injectable({
  providedIn: 'root'
})
export class GameListService {
  private readonly _games : WritableSignal<GameDto[]> = signal<GameDto[]>([{id:1, name:"Catan", type:"Board Game", ageMin:10,logoUrl:undefined, editeur:"Asmodee", MaxPlayers:4},
  {id:2, name:"Pandemic", type:"Cooperative Game", ageMin:8,logoUrl:undefined, editeur:"Ludonaute", MaxPlayers:4},
  {id:3, name:"7 Wonders", type:"Card Game", ageMin:10,logoUrl:undefined, editeur:"Smock", MaxPlayers:7}
  ]);

  games = this._games.asReadonly();

  nextId = 4;

  onNewGame(game: Omit<GameDto,'id'>): void {
    const newGame: GameDto = {
      ...game, // spread operator to copy properties from game
      id: this.nextId++
    };
    this._games.update(games => [...games, newGame]);
  }

  onDeleteGame(gameId: number): void {
    this._games.update(games => games.filter(game => game.id !== gameId));
  }

  removeAllGames(): void {
    this._games.set([]);
  }

  updateGame(id : number, updatedGame: Omit<GameDto,'id'>): void {
    this._games.update(games => games.map(game => 
      game.id === id ? { ...updatedGame, id } : game
    ));
  }

  findGameById(id: number): GameDto | undefined {return this._games().find(game => game.id === id);}


  
}
