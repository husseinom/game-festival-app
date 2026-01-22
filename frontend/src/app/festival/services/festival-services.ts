import { inject, Injectable, signal } from '@angular/core';
import { Festival } from '../../types/festival';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class FestivalServices {
  private readonly http = inject(HttpClient);
  private readonly _festivals = signal<Festival[]>([]);
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

    this.http.post<Festival>(`${environment.apiUrl}/festivals/add`, festival, {
      withCredentials: true
    }).subscribe({
      next:(newFestival) => {
        // L'API retourne directement le festival, pas {message, data}
        const currentFestivals = this._festivals();
        this._festivals.set([...currentFestivals, newFestival]);
        this._isLoading.set(false);
      },
      error: (error) => {
        console.error('Error adding festival:', error);
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
        console.error('Error deleting festival:', error);
        this._error.set(error.error?.error || 'Error deleting festival');
        this._isLoading.set(false);
      }
    });
  }

  updateFestival(festival: Festival): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.http.put<Festival>(`${environment.apiUrl}/festivals/${festival.id}`, festival, {
      withCredentials: true
    }).subscribe({
      next: (updatedFestival) => {
        // L'API retourne directement le festival, pas {message, data}
        const currentFestivals = this._festivals().map(f => 
          f.id === updatedFestival.id ? updatedFestival : f
        );
        this._festivals.set(currentFestivals);
        this._isLoading.set(false);
      },
      error: (error) => {
        console.error('Error updating festival:', error);
        this._error.set(error.error?.error || 'Error updating festival');
        this._isLoading.set(false);
      }
    });
  }

  findFestivalById(id: number): Festival | undefined {
    return this._festivals().find(festival => festival.id === id);
  }
}
