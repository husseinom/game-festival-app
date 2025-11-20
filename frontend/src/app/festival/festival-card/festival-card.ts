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

  isSelected = signal(false);

  get isGoingOn(): boolean {
    const now = new Date();
    const fest = this.festivals();
    if (!fest) return false;
    return fest.start <= now && now <= fest.end;
  }

  getStatusClass(): string {
    const now = new Date();
    const fest = this.festivals();
    if (!fest) return 'upcoming';
    
    if (fest.start <= now && now <= fest.end) {
      return 'ongoing';
    } else if (fest.start > now) {
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

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  Ondelete(): void {
    this.remove.emit(this.festivals()!);
  }
}
