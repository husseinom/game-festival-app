import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from '../auth/auth-service';
import { Role } from '../../types/user-dto';
import { hasMinimumRole } from '../guards/role.guard';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly authService = inject(AuthService);

  readonly currentRole = computed(() => this.authService.currentUser()?.role);

  
  hasMinRole(minimumRole: Role): boolean {
    return hasMinimumRole(this.currentRole(), minimumRole);
  }

  readonly isVisitor = computed(() => this.hasMinRole('VISITOR'));
  readonly isVolunteer = computed(() => this.hasMinRole('VOLUNTEER'));
  readonly isOrganisator = computed(() => this.hasMinRole('ORGANISATOR'));
  readonly isSuperOrganisator = computed(() => this.hasMinRole('SUPER_ORGANISATOR'));
  readonly isAdmin = computed(() => this.currentRole() === 'ADMIN');

  
  readonly canViewGames = computed(() => this.isVisitor());
  readonly canViewPlan = computed(() => this.isVisitor());
  
  readonly canEditGames = computed(() => this.isOrganisator());
  readonly canEditPublishers = computed(() => this.isOrganisator());
  readonly canEditContacts = computed(() => this.isOrganisator());
  
  readonly canManageReservations = computed(() => this.isSuperOrganisator());
  readonly canManageReservants = computed(() => this.isSuperOrganisator());
  readonly canManageSpaces = computed(() => this.isSuperOrganisator());
  readonly canViewFinances = computed(() => this.isSuperOrganisator());
  
  readonly canManageUsers = computed(() => this.isAdmin());
}
