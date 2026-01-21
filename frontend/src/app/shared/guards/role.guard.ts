import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';
import { Role } from '../../types/user-dto';

// Hiérarchie des rôles (du plus bas au plus haut)
const ROLE_HIERARCHY: Role[] = ['VISITOR', 'VOLUNTEER', 'ORGANISATOR', 'SUPER_ORGANISATOR', 'ADMIN'];

// Vérifie si un rôle a au moins le niveau requis
export function hasMinimumRole(userRole: Role | undefined, minimumRole: Role): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(minimumRole);
  return userLevel >= requiredLevel;
}

// Guard pour les organisateurs et plus (ajouter/modifier éditeurs, contacts, jeux)
export const organisatorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && hasMinimumRole(user.role, 'ORGANISATOR')) {
    return true;
  }

  router.navigate(['/festival-list']);
  return false;
};

// Guard pour les super-organisateurs et plus (réservations, espaces, suivi financier)
export const superOrganisatorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && hasMinimumRole(user.role, 'SUPER_ORGANISATOR')) {
    return true;
  }

  router.navigate(['/festival-list']);
  return false;
};

// Guard pour les admins uniquement (gestion des comptes)
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && user.role === 'ADMIN') {
    return true;
  }

  router.navigate(['/festival-list']);
  return false;
};
