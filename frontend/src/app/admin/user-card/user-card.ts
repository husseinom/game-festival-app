import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserDto } from '../../types/user-dto';
import { Role } from '../service/admin.service';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-card.html',
  styleUrl: './user-card.css'
})
export class UserCard {
  user = input.required<UserDto>();
  isCurrentUser = input<boolean>(false);
  
  roleChanged = output<{ userId: number; role: Role }>();
  deleteRequested = output<number>();

  readonly roles: { value: Role; label: string }[] = [
    { value: 'VISITOR', label: 'Visitor' },
    { value: 'VOLUNTEER', label: 'Volunteer' },
    { value: 'ORGANISATOR', label: 'Organisator' },
    { value: 'SUPER_ORGANISATOR', label: 'Super Organisator' },
    { value: 'ADMIN', label: 'Administrator' }
  ];

  onRoleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newRole = select.value as Role;
    this.roleChanged.emit({ userId: this.user().id, role: newRole });
  }

  onDelete() {
    this.deleteRequested.emit(this.user().id);
  }
}
