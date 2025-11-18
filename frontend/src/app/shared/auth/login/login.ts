import { Component, effect, inject, output } from '@angular/core';
import { AuthService } from '../auth-service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserDto } from '../../../types/user-dto';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly loggingService = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = new FormGroup({
    login: new FormControl('', {nonNullable: true , validators: [Validators.required]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  });

  readonly isLoading = this.loggingService.isLoading;
  readonly LoggedIn = this.loggingService.isLoggedIn;
  readonly error = this.loggingService.error;

  constructor(){
    effect(() => {
      if(this.LoggedIn()){
        if(this.loggingService.isAdmin()){
          this.router.navigate(['/admin'])
        }
        else{
          this.router.navigate(['/home'])
        }
      }
    })
  }

  OnSubmit(event: Event):void{
    event.preventDefault();
    if(this.form.invalid){
      this.form.markAllAsTouched(); 
      return; 
    }
    const login = this.form.controls.login.value;
    const password = this.form.controls.password.value;

    this.loggingService.login(login, password);
  }
  get LoginControl(){ return this.form.controls.login;}
  get passwordControl() {return this.form.controls.password;}    

}
