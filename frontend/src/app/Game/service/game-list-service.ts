import { Injectable,inject,signal,WritableSignal} from '@angular/core';
import { GameDto } from '../../types/game-dto';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class GameListService {
  private readonly http = inject(HttpClient);
  private readonly _games : WritableSignal<GameDto[]> = signal<GameDto[]>([]);
  private readonly _gameTypes = signal<{id: number, label: string}[]>([]);
  
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  games = this._games.asReadonly();
  gameTypes = this._gameTypes.asReadonly();
  isLoading = this._isLoading.asReadonly()
  error = this._error.asReadonly()

  getGames():void{
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<GameDto[]>(`${environment.apiUrl}/games/all`, { withCredentials: true })
    .subscribe({
      next: (data) => {
        this._games.set(data);
        this._isLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching games:', error);
        this._error.set('Failed to load games.');
        this._isLoading.set(false);
      }
    });
  }

  onNewGame(game: Omit<GameDto,'id'>): void {
    this.http.post<GameDto>(`${environment.apiUrl}/games/add`, game, { withCredentials: true })
    .subscribe({
      next: (newGame) => {
        this._games.update(games => [...games, newGame]);
      },
      error: (error) => {
        console.error('Error creating game:', error);
      }
    });
  }

  updateGame(id : number, updatedGame: Omit<GameDto,'id'>): void {
    this.http.put<GameDto>(`${environment.apiUrl}/games/${id}`, updatedGame, { withCredentials: true })
    .subscribe({
      next: (updatedGame) => {
        this._games.update(games => games.map(game => 
          game.id === id ? updatedGame : game
        ));
      },
      error: (error) => {
        console.error('Error updating game:', error);
      }
    });
  }

  onDeleteGame(gameId: number): void {
    this.http.delete(`${environment.apiUrl}/games/${gameId}`, { withCredentials: true })
    .subscribe({
      next: () => {
        this._games.update(games => games.filter(game => game.id !== gameId));
      },
      error: (error) => {
        console.error('Error deleting game:', error);
      }
    });
  }

  removeAllGames(): void { 
    this._games.set([]);
  }

  getGameTypes(): void {
    this.http.get<{id: number, label: string}[]>(`${environment.apiUrl}/games/types`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._gameTypes.set(data);
        },
        error: (error) => {
          console.error('Error fetching game types:', error);
        }
      });
  }


  // private readonly _games : WritableSignal<GameDto[]> = signal<GameDto[]>([{id:1, name:"Catan", type:"Board Game", ageMin:10,logoUrl:undefined, pubId:1, MaxPlayers:4},
  // {id:2, name:"Pandemic", type:"Cooperative Game", ageMin:8,logoUrl:undefined, pubId:2, MaxPlayers:4},
  // {id:3, name:"7 Wonders", type:"Card Game", ageMin:10,logoUrl:undefined, pubId:3, MaxPlayers:7}
  // ]);

  // games = this._games.asReadonly();

  // nextId = 4;

  // onNewGame(game: Omit<GameDto,'id'>): void {
  //   const newGame: GameDto = {
  //     ...game, // spread operator to copy properties from game
  //     id: this.nextId++
  //   };
  //   this._games.update(games => [...games, newGame]);
  // }

  // onDeleteGame(gameId: number): void {
  //   this._games.update(games => games.filter(game => game.id !== gameId));
  // }

  // removeAllGames(): void {
  //   this._games.set([]);
  // }

  // updateGame(id : number, updatedGame: Omit<GameDto,'id'>): void {
  //   this._games.update(games => games.map(game => 
  //     game.id === id ? { ...updatedGame, id } : game
  //   ));
  // }

  findGameById(id: number): GameDto | undefined {return this._games().find(game => game.id === id);}


  
}
