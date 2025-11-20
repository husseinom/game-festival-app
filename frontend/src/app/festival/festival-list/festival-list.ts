import { Component, inject } from '@angular/core';
import { FestivalServices } from '../services/festival-services';
import { Festival } from '../../types/festival';
import { FestivalCard } from '../festival-card/festival-card';
import { Router} from '@angular/router';
import { AuthService } from '../../shared/auth/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-festival-list',
  imports: [FestivalCard, CommonModule],
  templateUrl: './festival-list.html',
  // styleUrl: './festival-list.css',
})
export class FestivalList {
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
  readonly svc = inject(FestivalServices);
  festivals = this.svc.festivals;

  getFestivalById(id:number):Festival |undefined{
    if(this.findbyid(id)){
      return this.findbyid(id);
    }
    else{
      return;
    }
  }
  add(Festival: Festival): void{
    this.svc.add(Festival);
  }
  remove(Festival: Festival):void{
    this.svc.remove(Festival);
  }
  findbyid(id:number):Festival | undefined{
    return this.svc.findById(id);
  }

  // toggleform():void{
  //   this.showform.set(true);
  // }
  // hideform():void{
  //   this.showform.set(false);
  // }
}
