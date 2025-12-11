import { Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth-service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly loggingService = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = new FormGroup({
    email: new FormControl('', {nonNullable: true , validators: [Validators.required]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    name: new FormControl('', {nonNullable: true, validators: [Validators.required]})
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
    const name = this.form.controls.name.value;
    const email = this.form.controls.email.value;
    const password = this.form.controls.password.value;

    this.loggingService.register(name, email, password);
  }
  get NameControl(){return this.form.controls.name;}
  get EmailControl(){ return this.form.controls.email;}
  get passwordControl() {return this.form.controls.password;}    

}

