import { Component, input, output, signal } from '@angular/core';
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

  isSelected = signal(false);

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
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  Ondelete(): void {
    this.remove.emit(this.festivals()!);
  }

  onEdit(): void {
    this.edit.emit(this.festivals()!);
  }
}
