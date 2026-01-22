import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is logged in, allow access
  if (authService.isLoggedIn()) {
    // console.log('✅ User already logged in');
    return true;
  }

  // If we haven't checked auth yet (page refresh scenario)
  if (!authService.hasCheckedAuth()) {
    console.log('🔍 Haven\'t checked auth yet, checking cookies...');

    return authService.whoami().pipe(
      map(() => {
        if (authService.isLoggedIn()) {
          console.log('✅ Auth verified via cookies');
          return true;
        } else {
          console.log('❌ No valid session, redirecting');
          return router.createUrlTree(['/login']);
        }
      }),
      catchError(() => {
        console.log('❌ Auth check failed');
        return of(router.createUrlTree(['/login']));
      })
    );
  }

  // We've already checked auth and user isn't logged in
  console.log('❌ Already checked auth, user not logged in');
  return router.createUrlTree(['/login']);
};
