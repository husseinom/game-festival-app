import { Component, inject, signal } from '@angular/core';
import { Router, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { Login } from './shared/auth/login/login';
import { AuthService } from './shared/auth/auth-service';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbar, MatToolbarRow, RouterOutlet, RouterLinkActive, RouterModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  private authService = inject(AuthService);
  readonly router = inject(Router);

  readonly loggedIn = this.authService.isLoggedIn;
  readonly isAdmin = this.authService.isAdmin;
  readonly currentUser = this.authService.currentUser;
  readonly isLoading = this.authService.isLoading;
  

  LoggedOut(): void{
    setTimeout(() => {
    this.authService.logout();
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 50);
    }, 0);

  }
}
