import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { UserDto } from '../../types/user-dto';

export type Role = 'ADMIN' | 'VISITOR' | 'VOLUNTEER' | 'ORGANISATOR' | 'SUPER_ORGANISATOR';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  
  private readonly _users = signal<UserDto[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _success = signal<string | null>(null);

  readonly users = this._users.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly success = this._success.asReadonly();

  getAllUsers() {
    this._isLoading.set(true);
    this._error.set(null);
    
    this.http.get<UserDto[]>(
      `${environment.apiUrl}/users/admin/all`,
      { withCredentials: true }
    ).subscribe({
      next: (users) => {
        this._users.set(users);
        this._isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des utilisateurs', err);
        this._error.set('Erreur lors de la récupération des utilisateurs');
        this._isLoading.set(false);
      }
    });
  }

  createUser(userData: { name: string; email: string; password: string; role: Role }) {
    this._isLoading.set(true);
    this._error.set(null);
    this._success.set(null);

    this.http.post<{ message: string; user: UserDto }>(
      `${environment.apiUrl}/users/admin/create`,
      userData,
      { withCredentials: true }
    ).subscribe({
      next: (res) => {
        this._users.update(users => [...users, res.user]);
        this._success.set('Utilisateur créé avec succès');
        this._isLoading.set(false);
      },
      error: (err) => {
        if (err.status === 409) {
          this._error.set('Cet email est déjà utilisé');
        } else {
          this._error.set('Erreur lors de la création de l\'utilisateur');
        }
        this._isLoading.set(false);
      }
    });
  }

  updateUserRole(userId: number, role: Role) {
    this._isLoading.set(true);
    this._error.set(null);
    this._success.set(null);

    this.http.put<{ message: string; user: UserDto }>(
      `${environment.apiUrl}/users/admin/${userId}/role`,
      { role },
      { withCredentials: true }
    ).subscribe({
      next: (res) => {
        this._users.update(users => 
          users.map(u => u.id === userId ? res.user : u)
        );
        this._success.set('Rôle mis à jour avec succès');
        this._isLoading.set(false);
      },
      error: (err) => {
        this._error.set('Erreur lors de la mise à jour du rôle');
        this._isLoading.set(false);
      }
    });
  }

  deleteUser(userId: number) {
    this._isLoading.set(true);
    this._error.set(null);
    this._success.set(null);

    this.http.delete<{ message: string }>(
      `${environment.apiUrl}/users/admin/${userId}`,
      { withCredentials: true }
    ).subscribe({
      next: () => {
        this._users.update(users => users.filter(u => u.id !== userId));
        this._success.set('Utilisateur supprimé avec succès');
        this._isLoading.set(false);
      },
      error: (err) => {
        this._error.set('Erreur lors de la suppression de l\'utilisateur');
        this._isLoading.set(false);
      }
    });
  }

  clearMessages() {
    this._error.set(null);
    this._success.set(null);
  }
}
