import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { UserList } from '../user-list/user-list';
import { ReservantList } from '../../reservant/reservant-list/reservant-list';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    UserList,
    ReservantList],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  constructor(private router: Router) {}

  back(): void {
    this.router.navigate(['/festival-list']);
  }

}
