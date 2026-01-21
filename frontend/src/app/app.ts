import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './shared/auth/auth-service';
import { RoleService } from './shared/services/role.service';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatButton, MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbar, MatToolbarRow, RouterLinkActive, RouterModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  private authService = inject(AuthService);
  private roleService = inject(RoleService);
  readonly router = inject(Router);

  readonly loggedIn = this.authService.isLoggedIn;
  readonly isAdmin = this.roleService.isAdmin;
  readonly isSuperOrganisator = this.roleService.isSuperOrganisator;
  readonly isOrganisator = this.roleService.isOrganisator;
  readonly currentUser = this.authService.currentUser;
  readonly isLoading = this.authService.isLoading;

  constructor() {
    // Vérifier la session au démarrage de l'application (après refresh)
    if (!this.authService.hasCheckedAuth()) {
      this.authService.whoami().subscribe();
    }
  }

  LoggedOut(): void{
    setTimeout(() => {
    this.authService.logout();
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 50);
    }, 0);

  }
}