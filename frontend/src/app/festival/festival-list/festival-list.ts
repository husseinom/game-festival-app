import { Component, effect, inject, signal, computed } from '@angular/core';
import { FestivalServices } from '../services/festival-services';
import { Festival } from '../../types/festival';
import { FestivalCard } from '../festival-card/festival-card';
import { Router} from '@angular/router';
import { AuthService } from '../../shared/auth/auth-service';
import { CommonModule } from '@angular/common';
import { FestivalForm } from "../festival-form/festival-form";
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog-data/confirm-dialog-data';

@Component({
  selector: 'app-festival-list',
  imports: [FestivalCard, CommonModule, FestivalForm],
  templateUrl: './festival-list.html',
  styleUrl: './festival-list.css',
})
export class FestivalList {
  private readonly authservice = inject(AuthService);
  private readonly festivalService = inject(FestivalServices);
  private readonly dialog = inject(MatDialog);
  readonly router = inject(Router);
  readonly currentUser = this.authservice.currentUser;
  readonly loggedIn = this.authservice.isLoggedIn;
  readonly isAdmin = this.authservice.isAdmin;
  readonly canManageFestivals = this.authservice.canManageFestivals;
  readonly showform = signal(false);
  readonly editingFestival = signal<Festival | undefined>(undefined);

  readonly selectedId = signal<number | null>(null);
  readonly selectedFestival = signal<Festival | null>(null);
  
  // Search and filter
  searchQuery = signal('');
  dateFilter = signal<'all' | 'upcoming' | 'ongoing' | 'past'>('all');
  
  // All festivals from service
  allFestivals = this.festivalService.festivals;

  // Filtered festivals
  festivals = computed(() => {
    let filtered = this.allFestivals();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.dateFilter();

    // Search by name or location
    if (query) {
      filtered = filtered.filter((festival: Festival) => 
        festival.name.toLowerCase().includes(query) ||
        festival.location.toLowerCase().includes(query)
      );
    }

    // Filter by date
    const now = new Date();
    if (filter === 'upcoming') {
      filtered = filtered.filter((f: Festival) => new Date(f.startDate) > now);
    } else if (filter === 'ongoing') {
      filtered = filtered.filter((f: Festival) => 
        new Date(f.startDate) <= now && new Date(f.endDate) >= now
      );
    } else if (filter === 'past') {
      filtered = filtered.filter((f: Festival) => new Date(f.endDate) < now);
    }

    return filtered;
  });

  festivalCount = computed(() => this.festivals().length);
  totalCount = computed(() => this.allFestivals().length);

  constructor(){
    effect(()=> {
      this.festivalService.getFestivals();
      const id = this.selectedId();
      if (id !== null) {
        const festival = this.festivalService.findFestivalById(id);
        this.selectedFestival.set(festival || null);
      } else {
        this.selectedFestival.set(null);
      }
    })
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onDateFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'upcoming' | 'ongoing' | 'past';
    this.dateFilter.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.dateFilter.set('all');
  }

  add(Festival: Festival): void{
    this.festivalService.addFestival(Festival);
    this.hideform();
  }

  remove(festival: Festival): void {
    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer la suppression du festival',
      message: `Êtes-vous sûr de vouloir supprimer le festival "${festival.name}" ?\n\n⚠️ Cette action supprimera également :\n- Toutes les zones de prix\n- Toutes les map zones\n- Toutes les réservations\n- Tous les jeux assignés\n\n⚠️ Cette action est irréversible !`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.festivalService.deleteFestival(festival);
      }
    });
  }

  edit(festival: Festival): void {
    this.editingFestival.set(festival);
    this.toggleform();
  }

  update(festival: Festival): void {
    this.festivalService.updateFestival(festival);
    this.hideform();
  }

  toggleform():void{
    this.showform.set(true);
  }
  
  hideform():void{
    this.showform.set(false);
    this.editingFestival.set(undefined);
  }

  goToFestival(id: number){
    this.router.navigate(['/festival', id])
  }
}
