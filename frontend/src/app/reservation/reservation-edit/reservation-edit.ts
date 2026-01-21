import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../services/reservation.service';
import { CommonModule, Location } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { PriceZoneServices } from '../../PriceZone/services/price-zone-services';
import { GamePubListService } from '../../GamePublisher/service/game-pub-list-service';
import { ReservantService } from '../../reservant/services/reservant-service';
import { FestivalServices } from '../../festival/services/festival-services';
import { CreateReservationDTO, Reservation, ReservationStatus } from '../../types/reservation';
import { ReservantTypeLabelPipe } from '../../shared/pipes/reservant-type-label.pipe';

@Component({
  selector: 'app-reservation-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ReservantTypeLabelPipe],
  templateUrl: './reservation-edit.html',
  styleUrl: './reservation-edit.css'
})
export class ReservationEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly reservationService = inject(ReservationService);
  private readonly priceZoneService = inject(PriceZoneServices);
  private readonly gamePubService = inject(GamePubListService);
  private readonly reservantService = inject(ReservantService);
  private readonly festivalService = inject(FestivalServices);

  priceZones = this.priceZoneService.priceZones;
  gamePublishers = this.gamePubService.gamePubs;
  festivals = this.festivalService.festivals;
  reservants = this.reservantService.reservants;

  reservationId: number | null = null;
  isLoading = true;

  readonly form = new FormGroup({
    festival_id: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    reservant_id: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    game_publisher_id: new FormControl<string>('', {
      nonNullable: true
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
    discount_amount: new FormControl<number | null>(null),
    discount_tables: new FormControl<number | null>(null),
    nb_electrical_outlets: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    tables: new FormArray<FormGroup>([])
  });

  constructor() {
    this.gamePubService.getGamePubs();
    this.festivalService.getFestivals();
    this.priceZoneService.getPriceZones();
    this.reservantService.getReservants();
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.reservationId = Number(idParam);
      this.loadReservation(this.reservationId);
    }
  }

  private loadReservation(id: number): void {
    this.reservationService.getById(id).subscribe({
      next: (reservation) => {
        this.populateForm(reservation);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement réservation:', err);
        this.isLoading = false;
      }
    });
  }

  private populateForm(reservation: Reservation): void {
    this.form.patchValue({
      festival_id: String(reservation.festival_id),
      reservant_id: String(reservation.reservant_id),
      game_publisher_id: reservation.game_publisher_id ? String(reservation.game_publisher_id) : '',
      status: reservation.status ?? ReservationStatus.NOT_CONTACTED,
      comments: reservation.comments ?? '',
      is_publisher_presenting: reservation.is_publisher_presenting,
      needs_festival_animators: reservation.needs_festival_animators ?? false,
      discount_amount: reservation.discount_amount ?? null,
      discount_tables: reservation.discount_tables ?? null,
      nb_electrical_outlets: reservation.nb_electrical_outlets ?? 0
    });

    // Clear and populate tables array
    const tablesArray = this.form.get('tables') as FormArray;
    tablesArray.clear();

    if (reservation.zones && reservation.zones.length > 0) {
      reservation.zones.forEach(zone => {
        tablesArray.push(
          new FormGroup({
            price_zone_id: new FormControl<string>(String(zone.priceZone.id), {
              nonNullable: true,
              validators: [Validators.required]
            }),
            table_count: new FormControl<number | null>(zone.table_count, {
              nonNullable: false,
              validators: [Validators.required, Validators.min(0.5)]
            })
          })
        );
      });
    }
  }

  get tablesArray(): FormArray {
    return this.form.get('tables') as FormArray;
  }

  addTable(): void {
    const tablesArray = this.form.get('tables') as FormArray;
    tablesArray.push(
      new FormGroup({
        price_zone_id: new FormControl<string>('', {
          nonNullable: true,
          validators: [Validators.required]
        }),
        table_count: new FormControl<number | null>(null, {
          nonNullable: false,
          validators: [Validators.required, Validators.min(0.5)]
        })
      })
    );
  }

  removeTable(index: number): void {
    const tablesArray = this.form.get('tables') as FormArray;
    tablesArray.removeAt(index);
  }

  onSubmit(event: Event): void {
    console.log('Submitting form...');
    event.preventDefault();

    if (this.form.invalid || !this.reservationId) {
      console.warn('Formulaire invalide', this.form.errors);
      return;
    }

    const formValue = this.form.value;

    // Convertir les strings en numbers pour l'API
    const payload: Partial<CreateReservationDTO> = {
      game_publisher_id: formValue.game_publisher_id ? Number(formValue.game_publisher_id) : undefined,
      festival_id: Number(formValue.festival_id),
      reservant_id: Number(formValue.reservant_id),
      status: formValue.status || ReservationStatus.NOT_CONTACTED,
      comments: formValue.comments || '',
      is_publisher_presenting: formValue.is_publisher_presenting || false,
      needs_festival_animators: formValue.needs_festival_animators || false,
      discount_amount: formValue.discount_amount || undefined,
      discount_tables: formValue.discount_tables || undefined,
      nb_electrical_outlets: formValue.nb_electrical_outlets || 0,
      tables: (formValue.tables as any[])?.map(t => ({
        price_zone_id: Number(t.price_zone_id),
        table_count: Number(t.table_count)
      })) || []
    };

    this.reservationService.update(this.reservationId, payload).subscribe({
      next: () => {
        this.router.navigate(['/reservation', this.reservationId]);
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/reservations']);
    }
  }
}
