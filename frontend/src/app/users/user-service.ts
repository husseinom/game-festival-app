import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { UserDto } from '../types/user-dto';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly _users= signal<UserDto[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly users = this._users.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  getUsers():void{
    this._isLoading.set(true);
    this._error.set(null);

    this.http.get<UserDto[]>(`${environment.apiUrl}/users`, {
      withCredentials: true}).subscribe({
        next: (users) =>{
          this._users.set(users);
          this._isLoading.set(false);
        },
        error: (error)=>{
          this._error.set(error.error?.error || 'Erreur lors du chargement des utilisateurs');
          this._isLoading.set(false);
        }
      })
  }

  
  
}
