import { Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Festival } from '../../types/festival';
@Component({
  selector: 'app-festival-card',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './festival-card.html',
  styleUrls: ['./festival-card.css'],
})
export class FestivalCard {
  festivals = input<Festival>();
  remove = output<Festival>();
  edit = output<Festival>();

  card = output<number>();


  isSelected = signal(false);

  // Computed total tables from all table types
  totalTables = computed(() => {
    const fest = this.festivals();
    if (!fest) return 0;
    return (fest.small_tables || 0) + (fest.large_tables || 0) + (fest.city_tables || 0);
  });

  get isGoingOn(): boolean {
    const now = new Date();
    const fest = this.festivals();
    if (!fest) return false;
    
    // Convert to Date objects if they're strings
    const startDate = typeof fest.startDate === 'string' ? new Date(fest.startDate) : fest.startDate;
    const endDate = typeof fest.endDate === 'string' ? new Date(fest.endDate) : fest.endDate;
    
    return startDate <= now && now <= endDate;
  }

  getStatusClass(): string {
    const now = new Date();
    const fest = this.festivals();
    if (!fest) return 'upcoming';
    
    // Convert to Date objects if they're strings
    const startDate = typeof fest.startDate === 'string' ? new Date(fest.startDate) : fest.startDate;
    const endDate = typeof fest.endDate === 'string' ? new Date(fest.endDate) : fest.endDate;
    
    if (startDate <= now && now <= endDate) {
      return 'ongoing';
    } else if (startDate > now) {
      return 'upcoming';
    } else {
      return 'ended';
    }
  }

  getStatusText(): string {
    const status = this.getStatusClass();
    switch (status) {
      case 'ongoing': return '🔴 Live Now';
      case 'upcoming': return '⏰ Upcoming';
      case 'ended': return '✅ Ended';
      default: return 'Unknown';
    }
  }

  formatDate(date: Date | string): string {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if it's a valid date
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  Ondelete(event: Event): void {
    event.stopPropagation();
    this.remove.emit(this.festivals()!);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.festivals()!);
  }

  onCardClick(event?: Event): void {
    // Card click -> show details
    event?.stopPropagation();
    const g = this.festivals();
    if (g && g.id !== null) {
      this.card.emit(g.id);
    }
  }
}
