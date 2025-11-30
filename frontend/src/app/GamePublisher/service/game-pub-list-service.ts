import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { signal, WritableSignal } from '@angular/core';
import { GamePublisherDto } from '../../types/game-publisher-dto';

@Injectable({
  providedIn: 'root'
})
export class GamePubListService {
  private readonly http = inject(HttpClient);
  private readonly _gamePubs : WritableSignal<GamePublisherDto[]> = signal<GamePublisherDto[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly gamePubs = this._gamePubs.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();


  getGamePubs():void{
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<GamePublisherDto[]>(`${environment.apiUrl}/game_publishers/all`)
    .subscribe({
      next: (data) => {
        this._gamePubs.set(data);
        this._isLoading.set(false);
      },
      error: (error) => {
        console.error('Error fetching game publishers:', error);
        this._error.set('Failed to load game publishers.');
        this._isLoading.set(false);
      }
    });
  }

  onNewGamePub(gamePub: Omit<GamePublisherDto,'id'>): void {
    this.http.post<GamePublisherDto>(`${environment.apiUrl}/game_publishers/add`, gamePub)
    .subscribe({
      next: (newGamePub) => {
        this._gamePubs.update(gamePubs => [...gamePubs, newGamePub]);
      },
      error: (error) => {
        console.error('Error creating game publisher:', error);
      }
    });
  }

  updateGamePub(id : number, updatedGamePub: Omit<GamePublisherDto,'id'>): void {
    this.http.put<GamePublisherDto>(`${environment.apiUrl}/game_publishers/${id}`, updatedGamePub)
    .subscribe({
      next: (updatedPub) => {
        this._gamePubs.update(gamePubs => gamePubs.map(gamePub => 
          gamePub.id === id ? updatedPub : gamePub
        ));
      },
      error: (error) => {
        console.error('Error updating game publisher:', error);
      }
    });
  }

  onDeleteGamePub(gamePubId: number): void {
    this.http.delete(`${environment.apiUrl}/game_publishers/${gamePubId}`)
    .subscribe({
      next: () => {
        this._gamePubs.update(gamePubs => gamePubs.filter(gamePub => gamePub.id !== gamePubId));
      },
      error: (error) => {
        console.error('Error deleting game publisher:', error);
      }
    });
  }

  removeAllGamePubs(): void {
    this._gamePubs.set([]);
  }

  findGamePubById(id: number): GamePublisherDto | undefined {
    return this._gamePubs().find(gamePub => gamePub.id === id);
  }



//   private readonly _gamePubs : WritableSignal<GamePublisherDto[]> = signal<GamePublisherDto[]>([{id:1, name:"Asmodee", logoUrl: undefined},
//   {id:2, name:"Smock", logoUrl: undefined},
//   {id:3, name:"Ludonaute", logoUrl: undefined}
//   ]);

//   gamePubs = this._gamePubs.asReadonly();

//   nextId = 4;

//   onNewGamePub(gamePub: Omit<GamePublisherDto,'id'>): void {
//     const newGamePub: GamePublisherDto = {
//       ...gamePub, // spread operator to copy properties from gamePublisher
//       id: this.nextId++
//     };
//     this._gamePubs.update(gamePubs => [...gamePubs, newGamePub]);
//   }

//   onDeleteGamePub(gamePubId: number): void {
//     this._gamePubs.update(gamePubs => gamePubs.filter(gamePub => gamePub.id !== gamePubId));
//   }

//   removeAllGamePubs(): void {
//     this._gamePubs.set([]);
//   }

//   updateGamePub(id : number, updatedGamePub: Omit<GamePublisherDto,'id'>): void {
//     this._gamePubs.update(gamePubs => gamePubs.map(gamePub => 
//       gamePub.id === id ? { ...updatedGamePub, id } : gamePub
//     ));
//   }

//   findGamePubById(id: number): GamePublisherDto | undefined {return this._gamePubs().find(gamePub => gamePub.id === id);}
}
