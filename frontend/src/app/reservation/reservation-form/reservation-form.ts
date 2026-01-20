import { Component, output, inject, signal, computed, effect } from '@angular/core';
import { CreateReservationDTO, Reservation, ReservationStatus } from '../../types/reservation';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { PriceZoneServices } from '../../PriceZone/services/price-zone-services';
import { GamePubListService } from '../../GamePublisher/service/game-pub-list-service';
import { ReservantService } from '../../reservant/services/reservant-service';
import { FestivalServices } from '../../festival/services/festival-services';
import { CommonModule } from '@angular/common';
import { ReservantTypeLabelPipe } from '../../shared/pipes/reservant-type-label.pipe';
import { ReservantType } from '../../types/reservant';

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule, CommonModule, ReservantTypeLabelPipe],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
})
export class ReservationForm {
  newReservation = output<CreateReservationDTO>();

  private readonly priceZoneService = inject(PriceZoneServices);
  private readonly gamePubService = inject(GamePubListService);
  private readonly reservantService = inject(ReservantService);
  private readonly festivalService = inject(FestivalServices);

  priceZones = this.priceZoneService.priceZones;
  gamePublishers = this.gamePubService.gamePubs;
  festivals = this.festivalService.festivals;
  reservants = this.reservantService.reservants;

  // Option "l'éditeur réserve pour lui-même"
  publisherIsReservant = signal(false);

  readonly form = new FormGroup({
    festival_id: new FormControl<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
    reservant_id: new FormControl<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required]
    }),
    game_publisher_id: new FormControl<number | null>(null, {
      nonNullable: false
    }),
    status: new FormControl<ReservationStatus>(ReservationStatus.NOT_CONTACTED, {
      nonNullable: true
    }),
    comments: new FormControl('', {
      nonNullable: true
    }),
    is_publisher_presenting: new FormControl(false, {
      nonNullable: true
    }),
    needs_festival_animators: new FormControl(false, {
      nonNullable: true
    }),
    large_table_request: new FormControl('', {
      nonNullable: true
    }),
    discount_amount: new FormControl<number | null>(null),
    discount_tables: new FormControl<number | null>(null),
    nb_electrical_outlets: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    tables: new FormArray([])
  });

  constructor() {
    this.gamePubService.getGamePubs();
    this.festivalService.getFestivals();
    this.priceZoneService.getPriceZones();
    this.reservantService.getReservants();
  }

  togglePublisherIsReservant(): void {
    this.publisherIsReservant.update(v => !v);
    
    if (this.publisherIsReservant()) {
      // Désactiver la validation du reservant_id
      this.form.get('reservant_id')?.clearValidators();
      this.form.get('reservant_id')?.setValue(null);
      // Rendre l'éditeur obligatoire
      this.form.get('game_publisher_id')?.setValidators([Validators.required]);
    } else {
      // Réactiver la validation du reservant_id
      this.form.get('reservant_id')?.setValidators([Validators.required]);
      this.form.get('game_publisher_id')?.clearValidators();
    }
    this.form.get('reservant_id')?.updateValueAndValidity();
    this.form.get('game_publisher_id')?.updateValueAndValidity();
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
      console.warn('Formulaire invalide', this.form.errors);
      return;
    }

    const formValue = this.form.value;

    // Si l'éditeur réserve pour lui-même, on passe publisher_is_reservant=true
    // Le backend créera automatiquement le réservant
    const reservation: CreateReservationDTO = {
      game_publisher_id: formValue.game_publisher_id!,
      festival_id: formValue.festival_id!,
      reservant_id: this.publisherIsReservant() ? undefined : formValue.reservant_id!,
      publisher_is_reservant: this.publisherIsReservant(),
      status: formValue.status || ReservationStatus.NOT_CONTACTED,
      comments: formValue.comments || '',
      is_publisher_presenting: formValue.is_publisher_presenting || false,
      needs_festival_animators: formValue.needs_festival_animators || false,
      large_table_request: formValue.large_table_request || undefined,
      discount_amount: formValue.discount_amount || undefined,
      discount_tables: formValue.discount_tables || undefined,
      nb_electrical_outlets: formValue.nb_electrical_outlets || 0,
      tables: (formValue.tables as any[]) || []
    };

    console.log('Envoi de la réservation:', reservation);

    this.newReservation.emit(reservation);
    
    this.form.reset({
      status: ReservationStatus.NOT_CONTACTED,
      is_publisher_presenting: false,
      needs_festival_animators: false,
      large_table_request: '',
      nb_electrical_outlets: 0
    });
    this.publisherIsReservant.set(false);
    const tablesArray = this.form.get('tables') as FormArray;
    tablesArray.clear();
  }

  onSubmit(event: Event): void {
    this.AddReservation(event);
  }
}
