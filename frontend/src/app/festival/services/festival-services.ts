import { inject, Injectable, signal } from '@angular/core';
import { Festival } from '../../types/festival';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class FestivalServices {
  private readonly http = inject(HttpClient);
  private readonly _festivals = signal<Festival[]>([
  //   {name:'gaming',location:'Montpellier',start:new Date('2025-12-12T18:00:00'),end: new Date('2025-12-15T23:00:00'), id:1, logo: undefined, total_table_nb: undefined},
  //   {name:'film',location:'Lyon',start:new Date('2025-11-12T18:00:00'),end: new Date('2025-11-15T23:00:00'), id:2, logo: undefined, total_table_nb: undefined},
  //   {name:'WOW',location:'Grenoble',start:new Date('2025-11-19T18:00:00'),end: new Date('2025-11-22T23:00:00'), id:3, logo: undefined, total_table_nb: undefined},
  //   {name:'film',location:'Lyon',start:new Date('2025-11-12T18:00:00'),end: new Date('2025-11-15T23:00:00'), id:4, logo: undefined, total_table_nb: undefined}
  ]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);


  readonly festivals = this._festivals.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  getFestivals():void{
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<Festival[]>(`${environment.apiUrl}/festivals/all`, {
      withCredentials: true}).subscribe({
        next: (festivals) =>{
          this._festivals.set(festivals);
          this._isLoading.set(false);
        },
        error: (error)=>{
          this._error.set(error.error?.error || 'Error Loading Festivals');
          this._isLoading.set(false);
        }
      })
  }

  addFestival(festival: Omit<Festival, "id">){
    this._isLoading.set(true);
    this._error.set(null);

    this.http.post<{message: string, data: Festival}>(`${environment.apiUrl}/festivals/add`, festival,{
      withCredentials: true
    }).subscribe({
      next:(response) => {
        const newFestival = response.data;
      
      
      
        const currentFestivals = this._festivals();
        this._festivals.set([...currentFestivals, newFestival]);
        this._isLoading.set(false);
      },
      error: (error) => {
        this._error.set(error.error?.error || 'Error adding festival');
        this._isLoading.set(false);
      }
    })
    
  }

  deleteFestival(festival: Festival): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.delete<{message: string}>(`${environment.apiUrl}/festivals/${festival.id}`, {
      withCredentials: true
    }).subscribe({
      next: () => {
        const updatedFestivals = this._festivals().filter(f => f.id !== festival.id);
        this._festivals.set(updatedFestivals);
        this._isLoading.set(false);
      },
      error: (error) => {
        this._error.set(error.error?.error || 'Error deleting festival');
        this._isLoading.set(false);
      }
    });
  }

  updateFestival(festival: Festival): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.put<{message: string, data: Festival}>(`${environment.apiUrl}/festivals/${festival.id}`, festival, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        const updatedFestival = response.data;
        const currentFestivals = this._festivals().map(f => f.id === updatedFestival.id ? updatedFestival : f);
        this._festivals.set(currentFestivals);
        this._isLoading.set(false);
      },
      error: (error) => {
        this._error.set(error.error?.error || 'Error updating festival');
        this._isLoading.set(false);
      }
    });
  }
}  
