import { Component, computed, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ReservantService } from '../services/reservant-service';
import { CreateReservantDTO, Reservant, UpdateReservantDTO, ReservantType, RESERVANT_TYPE_LABELS } from '../../types/reservant';

@Component({
  selector: 'app-reservant-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reservant-form.html',
  styleUrl: './reservant-form.css'
})
export class ReservantForm {
  private readonly reservantService = inject(ReservantService);
  readonly types: { value: ReservantType; label: string }[] = [
    { value: ReservantType.PUBLISHER, label: RESERVANT_TYPE_LABELS[ReservantType.PUBLISHER] },
    { value: ReservantType.PROVIDER, label: RESERVANT_TYPE_LABELS[ReservantType.PROVIDER] },
    { value: ReservantType.SHOP, label: RESERVANT_TYPE_LABELS[ReservantType.SHOP] },
    { value: ReservantType.ASSOCIATION, label: RESERVANT_TYPE_LABELS[ReservantType.ASSOCIATION] },
    { value: ReservantType.ANIMATION, label: RESERVANT_TYPE_LABELS[ReservantType.ANIMATION] }
  ];

  private readonly defaultType = this.types[0].value;
  
  reservant = input<Reservant | null>(null);
  reservantSaved = output<void>();

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    type: new FormControl<ReservantType>(this.defaultType, { nonNullable: true, validators: [Validators.required] })
  });

  readonly isEdit = computed(() => !!this.reservant());
  readonly title = computed(() => this.isEdit() ? 'Modifier un réservant' : 'Créer un réservant');
  readonly submitLabel = computed(() => this.isEdit() ? 'Mettre à jour' : 'Créer le réservant');

  readonly isLoading = this.reservantService.isLoading;

  constructor() {
    effect(() => {
      const current = this.reservant();
      if (current) {
        this.form.setValue({ name: current.name, type: current.type });
      } else {
        this.form.reset({ name: '', type: this.defaultType });
      }
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, type } = this.form.getRawValue();

    if (this.isEdit()) {
      const current = this.reservant();
      if (!current) return;

      const updatePayload: UpdateReservantDTO = { name, type };
      this.reservantService.onUpdateReservant(current.reservant_id, updatePayload);
    } else {
      const reservantData: CreateReservantDTO = { name, type };
      this.reservantService.onNewReservant(reservantData);
    }

    this.form.reset({ name: '', type: this.defaultType });
    this.reservantSaved.emit();
  }

  get nameControl() { return this.form.controls.name; }
  get typeControl() { return this.form.controls.type; }
}
