import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AdminAuthService } from './admin-auth.service';

export const adminAuthGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map((authenticated) =>
      authenticated
        ? true
        : router.createUrlTree(['/admin/login'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
  );
};
