import { Component, input, output, effect, inject } from '@angular/core';
import { CreateReservationDTO, Reservation } from '../../types/reservation';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ReservationService } from '../services/reservation.service';
import { PriceZoneServices } from '../../PriceZone/services/price-zone-services';
import { AuthService } from '../../shared/auth/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
})
export class ReservationForm {
  newReservation = output<CreateReservationDTO>();
  updatedReservation = output<Partial<CreateReservationDTO>>();
  editingReservation = input<Reservation>();

  private readonly reservationService = inject(ReservationService);
  private readonly priceZoneService = inject(PriceZoneServices);
  private readonly authService = inject(AuthService);

  priceZones = this.priceZoneService.priceZones;

  readonly form = new FormGroup({
    game_publisher_id: new FormControl<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
    festival_id: new FormControl<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
    status: new FormControl('Contact pris', {
      nonNullable: true
    }),
    comments: new FormControl('', {
      nonNullable: true
    }),
    is_publisher_presenting: new FormControl(false, {
      nonNullable: true
    }),
    game_list_requested: new FormControl(false, {
      nonNullable: true
    }),
    game_list_received: new FormControl(false, {
      nonNullable: true
    }),
    games_received: new FormControl(false, {
      nonNullable: true
    }),
    discount_amount: new FormControl<number | null>(null),
    discount_tables: new FormControl<number | null>(null),
    final_invoice_amount: new FormControl<number | null>(null),
    tables: new FormArray([])
  });

  constructor() {
    effect(() => {
      const reservation = this.editingReservation();
      if (reservation) {
        this.form.patchValue({
          game_publisher_id: reservation.game_publisher_id,
          festival_id: reservation.festival_id,
          status: reservation.status || 'Contact pris',
          comments: reservation.comments || '',
          is_publisher_presenting: reservation.is_publisher_presenting,
          game_list_requested: reservation.game_list_requested,
          game_list_received: reservation.game_list_received,
          games_received: reservation.games_received,
          discount_amount: reservation.discount_amount || null,
          discount_tables: reservation.discount_tables || null,
          final_invoice_amount: reservation.final_invoice_amount || null
        });

        const tablesArray = this.form.get('tables') as FormArray;
        tablesArray.clear();

        if (reservation.tables && Array.isArray(reservation.tables)) {
          reservation.tables.forEach(table => {
            tablesArray.push(
              new FormGroup({
                price_zone_id: new FormControl(table.price_zone_id, {
                  nonNullable: true,
                  validators: [Validators.required]
                }),
                table_count: new FormControl(table.table_count, {
                  nonNullable: true,
                  validators: [Validators.required, Validators.min(1)]
                })
              })
            );
          });
        }
      } else {
        this.form.reset({
          status: 'Contact pris',
          is_publisher_presenting: false,
          game_list_requested: false,
          game_list_received: false,
          games_received: false
        });
        const tablesArray = this.form.get('tables') as FormArray;
        tablesArray.clear();
      }
    });

    this.priceZoneService.getPriceZones();
  }

  get isEditing(): boolean {
    return this.editingReservation() !== undefined && this.editingReservation() !== null;
  }

  get tablesArray(): FormArray {
    return this.form.get('tables') as FormArray;
  }

  addTable(): void {
    const tablesArray = this.form.get('tables') as FormArray;
    tablesArray.push(
      new FormGroup({
        price_zone_id: new FormControl<number | null>(null, {
          nonNullable: false,
          validators: [Validators.required]
        }),
        table_count: new FormControl<number | null>(null, {
          nonNullable: false,
          validators: [Validators.required, Validators.min(1)]
        })
      })
    );
  }

  removeTable(index: number): void {
    const tablesArray = this.form.get('tables') as FormArray;
    tablesArray.removeAt(index);
  }

  AddReservation(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      console.error('Utilisateur non authentifié');
      return;
    }

    const reservation: CreateReservationDTO = {
      game_publisher_id: formValue.game_publisher_id!,
      festival_id: formValue.festival_id!,
      reservant_id: currentUser.id,
      status: formValue.status || 'Contact pris',
      comments: formValue.comments || '',
      is_publisher_presenting: formValue.is_publisher_presenting || false,
      game_list_requested: formValue.game_list_requested || false,
      game_list_received: formValue.game_list_received || false,
      games_received: formValue.games_received || false,
      discount_amount: formValue.discount_amount || undefined,
      discount_tables: formValue.discount_tables || undefined,
      final_invoice_amount: formValue.final_invoice_amount || undefined,
      tables: (formValue.tables as any[]) || []
    };

    this.newReservation.emit(reservation);
    this.form.reset({
      status: 'Contact pris',
      is_publisher_presenting: false,
      game_list_requested: false,
      game_list_received: false,
      games_received: false
    });
    const tablesArray = this.form.get('tables') as FormArray;
    tablesArray.clear();
  }

  UpdateReservation(event: Event): void {
    event.preventDefault();

    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    const updatedReservation: Partial<CreateReservationDTO> = {
      status: formValue.status || 'Contact pris',
      comments: formValue.comments || '',
      is_publisher_presenting: formValue.is_publisher_presenting,
      game_list_requested: formValue.game_list_requested,
      game_list_received: formValue.game_list_received,
      games_received: formValue.games_received,
      discount_amount: formValue.discount_amount || undefined,
      discount_tables: formValue.discount_tables || undefined,
      final_invoice_amount: formValue.final_invoice_amount || undefined,
      tables: (formValue.tables as any[]) || []
    };

    this.updatedReservation.emit(updatedReservation);
  }

  onSubmit(event: Event): void {
    if (this.isEditing) {
      this.UpdateReservation(event);
    } else {
      this.AddReservation(event);
    }
  }
}
