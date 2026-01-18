import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../services/reservation.service';
import { Reservation, CreateReservationDTO } from '../../types/reservation';
import { ReservationCard } from '../reservation-card/reservation-card';
import { ReservationForm } from '../reservation-form/reservation-form';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, ReservationCard, ReservationForm], 
  templateUrl: './reservation-list.html',
  styleUrls: ['./reservation-list.css']
})
export class ReservationList implements OnInit {
  reservations: Reservation[] = [];
  isLoading = true;
  showForm = signal(false);

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.reservationService.getAll().subscribe({
      next: (data) => {
        this.reservations = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.isLoading = false;
      }
    });
  }

  onReservationClick(id: number): void {
    this.router.navigate(['/reservations', id]);
  }

  toggleForm(): void {
    this.showForm.update(value => !value);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  onNewReservation(data: CreateReservationDTO): void {
    this.reservationService.create(data).subscribe({
      next: (response) => {
        this.reservationService.getById(response.data.reservation_id).subscribe({
          next: (fullReservation) => {
            this.reservations.push(fullReservation);
            this.closeForm();
          },
          error: (err) => {
            console.error('Erreur chargement réservation:', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur création:', err);
      }
    });
  }

  onDeleteReservation(id: number): void {
    this.reservationService.delete(id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.reservation_id !== id);
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
      }
    });
  }
}