import { Injectable } from '@angular/core';
import { signal, WritableSignal } from '@angular/core';
import { GamePublisherDto } from '../../types/game-publisher-dto';

@Injectable({
  providedIn: 'root'
})
export class GamePubListService {
  private readonly _gamePubs : WritableSignal<GamePublisherDto[]> = signal<GamePublisherDto[]>([{id:1, name:"Asmodee", logoUrl: undefined},
  {id:2, name:"Smock", logoUrl: undefined},
  {id:3, name:"Ludonaute", logoUrl: undefined}
  ]);

  gamePubs = this._gamePubs.asReadonly();

  nextId = 4;

  onNewGamePub(gamePub: Omit<GamePublisherDto,'id'>): void {
    const newGamePub: GamePublisherDto = {
      ...gamePub, // spread operator to copy properties from gamePublisher
      id: this.nextId++
    };
    this._gamePubs.update(gamePubs => [...gamePubs, newGamePub]);
  }

  onDeleteGamePub(gamePubId: number): void {
    this._gamePubs.update(gamePubs => gamePubs.filter(gamePub => gamePub.id !== gamePubId));
  }

  removeAllGamePubs(): void {
    this._gamePubs.set([]);
  }

  updateGamePub(id : number, updatedGamePub: Omit<GamePublisherDto,'id'>): void {
    this._gamePubs.update(gamePubs => gamePubs.map(gamePub => 
      gamePub.id === id ? { ...updatedGamePub, id } : gamePub
    ));
  }

  findGamePubById(id: number): GamePublisherDto | undefined {return this._gamePubs().find(gamePub => gamePub.id === id);}
}
