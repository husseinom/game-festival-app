import { Component, effect, inject } from '@angular/core';
import { UserService } from '../../users/user-service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin',
  imports: [MatCardModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  private readonly userService = inject(UserService);
  readonly users = this.userService.users;
  readonly isLoading = this.userService.isLoading;
  readonly error = this.userService.error;

  constructor(){
    effect(()=> {
      // if(!this.isLoading() && this.error()===null && this.userService.users().length ===0){
        this.userService.getUsers();
      // }
      })
  }

}
