import { Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ReservantService } from '../services/reservant-service';
import { CreateReservantDTO } from '../../types/reservant';

@Component({
  selector: 'app-reservant-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reservant-form.html',
  styleUrl: './reservant-form.css'
})
export class ReservantForm {
  private readonly reservantService = inject(ReservantService);
  
  reservantCreated = output<void>();

  readonly types: { value: string; label: string }[] = [
    { value: 'Éditeur', label: 'Éditeur' },
    { value: 'Prestataire', label: 'Prestataire' },
    { value: 'Boutique', label: 'Boutique' },
    { value: 'Association', label: 'Association' },
    { value: 'Animation / Zone Proto', label: 'Animation / Zone Proto' }
  ];

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    type: new FormControl<string>('BENEVOLE', { nonNullable: true, validators: [Validators.required] })
  });

  readonly isLoading = this.reservantService.isLoading;

  onSubmit(event: Event) {
    event.preventDefault();
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, type } = this.form.getRawValue();
    const reservantData: CreateReservantDTO = { name, type };
    
    this.reservantService.onNewReservant(reservantData);
    
    this.form.reset({ type: 'BENEVOLE' });
    this.reservantCreated.emit();
  }

  get nameControl() { return this.form.controls.name; }
  get typeControl() { return this.form.controls.type; }
}
