import { Component, effect, inject, output, signal } from '@angular/core';
import { AuthService } from '../auth-service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserDto } from '../../../types/user-dto';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly loggingService = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = new FormGroup({
    email: new FormControl('', {nonNullable: true , validators: [Validators.required]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  });

  readonly isLoading = this.loggingService.isLoading;
  readonly LoggedIn = this.loggingService.isLoggedIn;
  readonly error = this.loggingService.error;

  constructor(){
    effect(() => {
      if(this.LoggedIn()){
        // if(this.loggingService.isAdmin()){
        //   this.router.navigate(['/admin'])
        // }
        // else{
          this.router.navigate(['/festival-list'])
        // }
      }
    })
  }

  OnSubmit(event: Event):void{
    event.preventDefault();
    if(this.form.invalid){
      this.form.markAllAsTouched(); 
      return; 
    }
    const email = this.form.controls.email.value;
    const password = this.form.controls.password.value;

    this.loggingService.login(email, password);
  }
  get EmailControl(){ return this.form.controls.email;}
  get passwordControl() {return this.form.controls.password;}
  
  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

}
