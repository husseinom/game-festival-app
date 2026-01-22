import { Component, inject, signal, computed } from '@angular/core';
import { AdminService} from '../service/admin.service';
import { Role } from '../../types/user-dto';
import { UserCard } from '../user-card/user-card';
import { UserForm } from '../user-form/user-form';
import { AuthService } from '../../shared/auth/auth-service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog-data/confirm-dialog-data';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserCard, UserForm],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly users = this.adminService.users;
  readonly isLoading = this.adminService.isLoading;
  readonly error = this.adminService.error;
  readonly success = this.adminService.success;
  readonly currentUser = this.authService.currentUser;

  showForm = signal(false);
  userCount = computed(() => this.users().length);

  constructor() {
    this.adminService.getAllUsers();
  }

  toggleForm() {
    this.showForm.update(s => !s);
    this.adminService.clearMessages();
  }

  onUserCreated() {
    this.showForm.set(false);
  }

  onUpdateRole(data: { userId: number; role: Role }) {
    this.adminService.updateUserRole(data.userId, data.role);
  }

  onDeleteUser(userId: number) {
    const user = this.users().find(u => u.id === userId);
    if (!user) return;

    const dialogData: ConfirmDialogData = {
      title: '⚠️ Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?\n\nEmail: ${user.email}\nRôle: ${user.role}\n\n⚠️ Cette action est irréversible !`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.adminService.deleteUser(userId);
      }
    });
  }

  refreshUsers() {
    this.adminService.getAllUsers();
  }
}
