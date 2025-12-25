import { Component, input, output, effect } from '@angular/core';
import { Festival } from '../../types/festival';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-festival-form',
  imports: [ReactiveFormsModule],
  templateUrl: './festival-form.html',
  styleUrl: './festival-form.css'
})
export class FestivalForm {
  newFestival = output<Festival>();
  updatedFestival = output<Festival>();
  editingFestival = input<Festival>();
  
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true, 
      validators: [Validators.required, Validators.minLength(3)]
    }),
    location: new FormControl('', {
      nonNullable: true, 
      validators: [Validators.required, Validators.minLength(2)]
    }),
    total_tables: new FormControl<number>(1, {
      nonNullable: true, 
      validators: [Validators.min(1), Validators.max(1000)]
    }),
    startDate: new FormControl('', {
      nonNullable: true, 
      validators: [Validators.required]
    }),
    endDate: new FormControl('', {
      nonNullable: true, 
      validators: [Validators.required]
    })
  });

  constructor(){
    effect(() => {
      const festival = this.editingFestival();
      if(festival){
        this.form.patchValue({
          name: festival.name,
          location: festival.location,
          total_tables: festival.total_tables || 1,
          startDate: this.formatDateForInput(festival.startDate),
          endDate: this.formatDateForInput(festival.endDate)
        });
      } else {
        this.form.reset();
      }
    });

    // Add custom validator to ensure end date is after start date
    this.form.addValidators(this.dateRangeValidator);
  }

  get isEditing(): boolean {
    return this.editingFestival() !== undefined && this.editingFestival() !== null;
  }

  // Custom validator to ensure end date is after start date
  private dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        return { dateRange: true };
      }
    }
    return null;
  };

  private formatDateForInput(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // Format as YYYY-MM-DD for input[type="date"]
  }

  AddFestival(event: Event): void {
    event.preventDefault();
    
    if (this.form.invalid) {
      return;
    }

    const festival: Omit<Festival, 'id'> = {
      name: this.form.value.name!,
      location: this.form.value.location!,
      total_tables: this.form.value.total_tables!,
      startDate: new Date(this.form.value.startDate!),
      endDate: new Date(this.form.value.endDate!)
    };

    this.newFestival.emit(festival as Festival);
    this.form.reset();
  }

  UpdateFestival(event: Event): void {
    event.preventDefault();
    
    if (this.form.invalid) {
      return;
    }

    const updatedFestival: Festival = {
      ...this.editingFestival()!,
      name: this.form.value.name!,
      location: this.form.value.location!,
      total_tables: this.form.value.total_tables!,
      startDate: new Date(this.form.value.startDate!),
      endDate: new Date(this.form.value.endDate!)
    };

    this.updatedFestival.emit(updatedFestival);
  }

  onSubmit(event: Event): void {
    if (this.isEditing) {
      this.UpdateFestival(event);
    } else {
      this.AddFestival(event);
    }
  }
}
