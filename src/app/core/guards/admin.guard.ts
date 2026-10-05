import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Route guard protecting admin routes against unauthenticated access.
 * Redirects unauthenticated users to /admin/login.
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      }
      return router.createUrlTree(['/admin/login'], {
        queryParams: state.url !== '/admin/login' ? { returnUrl: state.url } : {}
      });
    })
  );
};
