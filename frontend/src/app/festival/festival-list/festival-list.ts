import { Component, effect, inject, signal } from '@angular/core';
import { FestivalServices } from '../services/festival-services';
import { Festival } from '../../types/festival';
import { FestivalCard } from '../festival-card/festival-card';
import { Router} from '@angular/router';
import { AuthService } from '../../shared/auth/auth-service';
import { CommonModule } from '@angular/common';
import { FestivalForm } from "../festival-form/festival-form";

@Component({
  selector: 'app-festival-list',
  imports: [FestivalCard, CommonModule, FestivalForm],
  templateUrl: './festival-list.html',
  styleUrl: './festival-list.css',
})
export class FestivalList {
  private readonly authservice = inject(AuthService);
  private readonly festivalService = inject(FestivalServices)
  readonly router = inject(Router);
  readonly currentUser = this.authservice.currentUser;
  readonly loggedIn = this.authservice.isLoggedIn;
  readonly isAdmin = this.authservice.isAdmin;
  readonly canManageFestivals = this.authservice.canManageFestivals;
  readonly showform = signal(false);
  readonly editingFestival = signal<Festival | undefined>(undefined);

  readonly selectedId = signal<number | null>(null)
  readonly selectedFestival = signal<Festival | null>(null)
  

  constructor(){
    // if(!this.loggedIn()){
    //   this.router.navigate(['/login']);
    // }
    effect(()=> {
        this.festivalService.getFestivals();
        const id = this.selectedId();
      if (id !== null) {
        const festival = this.festivalService.findFestivalById(id);
        this.selectedFestival.set(festival || null);
      } else {
        this.selectedFestival.set(null);
      }
      })

  }
  festivals = this.festivalService.festivals;

  
  add(Festival: Festival): void{
    this.festivalService.addFestival(Festival);
    this.hideform();
  }
  // remove(Festival: Festival):void{
  //   this.svc.remove(Festival);
  // }
  // findbyid(id:number):Festival | undefined{
  //   return this.svc.findById(id);
  // }
  remove(festival: Festival): void {
    console.log('Removing festival:', festival);
    this.festivalService.deleteFestival(festival);
  }

  edit(festival: Festival): void {
    this.editingFestival.set(festival);
    this.toggleform();
  }

  update(festival: Festival): void {
    this.festivalService.updateFestival(festival);
    this.hideform();
  }

  toggleform():void{
    this.showform.set(true);
  }
  hideform():void{
    this.showform.set(false);
    this.editingFestival.set(undefined);
  }

  goToFestival(id: number){
    this.router.navigate(['/festival', id])
  }
}
