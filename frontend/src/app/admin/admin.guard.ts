import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../shared/auth/auth-service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  if (user && user.role === 'ADMIN') {
    return true;
  }

  // Rediriger vers la page d'accueil si pas admin
  router.navigate(['/festival-list']);
  return false;
};
