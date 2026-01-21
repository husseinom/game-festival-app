import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { catchError, finalize, of, tap } from 'rxjs'
import { UserDto } from '../../types/user-dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient)
  // --- État interne (signaux) ---
  private readonly _currentUser = signal<UserDto | null>(null)
  private readonly _isLoading = signal(false)
  private readonly _error = signal<string | null>(null)
  private readonly _hasCheckedAuth = signal(false); // ✅ Track if we've checked auth
  // --- État exposé (readonly, computed) ---
  readonly currentUser = this._currentUser.asReadonly()
  readonly isLoggedIn = computed(() => this._currentUser() != null)
  readonly isAdmin = computed(() => this.currentUser()?.role?.toUpperCase() === 'ADMIN')
  readonly isSuperOrganisator = computed(() => this.currentUser()?.role?.toUpperCase() === 'SUPER_ORGANISATOR')
  readonly canManageFestivals = computed(() => {
    const role = this.currentUser()?.role?.toUpperCase();
    return role === 'ADMIN' || role === 'SUPER_ORGANISATOR';
  })
  readonly isLoading = this._isLoading.asReadonly()
  readonly error = this._error.asReadonly()
  readonly hasCheckedAuth = this._hasCheckedAuth.asReadonly()

  // --- Connexion ---
  login(email: string, password: string) {
    this._isLoading.set(true)
    this._error.set(null)
    this.http.post<{ user: UserDto }>(
      `${environment.apiUrl}/users/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
    tap(res => {
      if (res?.user) {
        this._currentUser.set(res.user)
        this._hasCheckedAuth.set(true); // ✅ Mark as checked after login
        console.log(`👍 Utilisateur connecté : ${JSON.stringify(res.user)}`) // DEBUG
      } else {
        this._error.set('Identifiants invalides')
        this._currentUser.set(null)
      }
    }),
    catchError((err) => {
      console.error('👎 Erreur HTTP', err)
      if (err.status === 401) { this._error.set('Identifiants invalides')}
      else if (err.status === 0) {
        this._error.set('Serveur injoignable (vérifiez HTTPS ou CORS)')
      } else { this._error.set(`Erreur serveur (${err.status})`) }
      this._currentUser.set(null)
      return of(null)
    }),
    finalize(() => this._isLoading.set(false))
    ).subscribe()
  }
  
  // --- Déconnexion ---
  logout() {
    this._isLoading.set(true) ; this._error.set(null)
    this.http.post(`${environment.apiUrl}/users/logout`, {}, { withCredentials: true })
    .pipe(
      tap(() => { 
        this._currentUser.set(null)
        this._hasCheckedAuth.set(false); // ✅ Reset flag on logout
      }),
      catchError( err => {this._error.set('Erreur de déconnexion') ; return of(null)} ),
      finalize(() => this._isLoading.set(false))
    )
    .subscribe()
  }

  register(name: string, email: string, password: string){
    this._isLoading.set(true); this._error.set(null)
    this.http.post<{user: UserDto}>(`${environment.apiUrl}/users/register`, 
      {name, email, password},
      {withCredentials: true}
    ).pipe(
      tap(res =>{
        if (res?.user) {
        this._currentUser.set(res.user)
        this._hasCheckedAuth.set(true); // ✅ Mark as checked after register
        console.log(`👍 Utilisateur enregistré et connecté : ${JSON.stringify(res.user)}`);
      } else {
        this._error.set('Erreur lors de l\'enregistrement');
      }
      }),
      catchError(err => {
        if(err.status === 409){
          this._error.set('cet email est déja utilisé');
        }else if(err.status === 400) {
        this._error.set('Données invalides');
      } else {
        this._error.set(`Erreur serveur (${err.status})`);
      }
      return of(null);
    }),
    finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  // --- Vérifie la session actuelle (cookie httpOnly) ---
  whoami() {
    this._isLoading.set(true);
    this._error.set(null);
    
    return this.http.get<{ user: UserDto }>(`${environment.apiUrl}/users/me`, { 
      withCredentials: true 
    }).pipe(
      tap(res => { 
        this._currentUser.set(res?.user ?? null);
        this._hasCheckedAuth.set(true); // ✅ Mark as checked
      }),
      catchError(err => {
        this._error.set('Session expirée');
        this._currentUser.set(null);
        this._hasCheckedAuth.set(true); // ✅ Mark as checked even on error
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  // --- Rafraîchissement pour l'interceptor ---
  refresh$() { // observable qui émet null en cas d'erreur
    return this.http.post(`${environment.apiUrl}/users/refresh`,{}, { withCredentials: true } )
    .pipe( catchError(() => of(null)) )
  }
}

