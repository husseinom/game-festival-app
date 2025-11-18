import { Component, inject } from '@angular/core';
import { AuthService } from '../../shared/auth/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly authservice = inject(AuthService);
  readonly router = inject(Router);
  readonly currentUser = this.authservice.currentUser;
  readonly loggedIn = this.authservice.isLoggedIn;
  readonly isAdmin = this.authservice.isAdmin;

  constructor(){
    if(!this.loggedIn()){
      this.router.navigate(['/login']);
    }
  }




}
