import { Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../service/admin.service';
import { Role } from '../../types/user-dto';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserForm {
  private readonly adminService = inject(AdminService);
  
  userCreated = output<void>();

  readonly roles: { value: Role; label: string }[] = [
    { value: 'VISITOR', label: 'Visitor' },
    { value: 'VOLUNTEER', label: 'Volunteer' },
    { value: 'ORGANISATOR', label: 'Organisator' },
    { value: 'SUPER_ORGANISATOR', label: 'Super Organisator' },
    { value: 'ADMIN', label: 'Administrator' }
  ];

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(4)] }),
    role: new FormControl<Role>('VISITOR', { nonNullable: true, validators: [Validators.required] })
  });

  readonly isLoading = this.adminService.isLoading;

  onSubmit(event: Event) {
    event.preventDefault();
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password, role } = this.form.getRawValue();
    this.adminService.createUser({ name, email, password, role });
    
   
    this.form.reset({ role: 'VISITOR' });
    this.userCreated.emit();
  }

  get nameControl() { return this.form.controls.name; }
  get emailControl() { return this.form.controls.email; }
  get passwordControl() { return this.form.controls.password; }
  get roleControl() { return this.form.controls.role; }
}
