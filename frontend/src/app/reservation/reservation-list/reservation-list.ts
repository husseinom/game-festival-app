import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../services/reservation.service';
import { Reservation } from '../../types/reservation';
import { ReservationCard } from '../reservation-card/reservation-card';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, ReservationCard], 
  templateUrl: './reservation-list.html',
  styleUrls: ['./reservation-list.css']
})
export class ReservationList implements OnInit {
  reservations: Reservation[] = [];
  isLoading = true;

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

  onAddReservation(): void {
    this.router.navigate(['/reservations/new']);
  }
}