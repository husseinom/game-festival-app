import { Injectable, signal } from '@angular/core';
import { Festival } from '../../types/festival';

@Injectable({
  providedIn: 'root',
})
export class FestivalServices {
  private readonly _festivals = signal<Festival[]>([
    {name:'gaming',location:'Montpellier',start:new Date('2025-12-12T18:00:00'),end: new Date('2025-12-15T23:00:00'), id:1, logo: undefined, total_table_nb: undefined},
    {name:'film',location:'Lyon',start:new Date('2025-11-12T18:00:00'),end: new Date('2025-11-15T23:00:00'), id:2, logo: undefined, total_table_nb: undefined},
    {name:'WOW',location:'Grenoble',start:new Date('2025-11-19T18:00:00'),end: new Date('2025-11-22T23:00:00'), id:3, logo: undefined, total_table_nb: undefined},
    {name:'film',location:'Lyon',start:new Date('2025-11-12T18:00:00'),end: new Date('2025-11-15T23:00:00'), id:4, logo: undefined, total_table_nb: undefined}
  ]);
  readonly festivals = this._festivals.asReadonly();

  private nextId = 3;
  add(festivalToAdd: Festival):void{
    const festivalWithId = {...festivalToAdd, id: this.nextId++}
    this._festivals.update(listfestivals => ([...listfestivals,festivalWithId]));
  }
  remove(festivalToRemove: Festival): void{
    this._festivals.update(listfestivals=>listfestivals.filter(item => item!==festivalToRemove));
  }
  findById(id:number): Festival | undefined{
    return this._festivals().find(festival => festival.id === id);
  }

  update(partial: Partial<Festival> & { id: number }): void {
    this._festivals.update(list =>
    list.map(s => (s.id === partial.id ? { ...s, ...partial } : s)))
  }
}
