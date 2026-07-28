import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AdminAuthService } from './admin-auth.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const adminHttpInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/v1/')) {
    return next(request);
  }

  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const withCredentials = request.clone({ withCredentials: true });
  const needsCsrf =
    request.url.startsWith('/api/v1/admin/') || request.url === '/api/v1/auth/logout';
  const send =
    MUTATING_METHODS.has(request.method) && needsCsrf
      ? auth
          .csrfToken()
          .pipe(
            switchMap((token) =>
              next(withCredentials.clone({ setHeaders: { 'X-CSRF-Token': token } })),
            ),
          )
      : next(withCredentials);

  return send.pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        request.url !== '/api/v1/auth/login' &&
        request.url !== '/api/v1/auth/session'
      ) {
        auth.clearLocalSession();
        void router.navigate(['/admin/login'], {
          queryParams: {
            returnUrl: router.url.startsWith('/admin') ? router.url : '/admin',
            reason: 'expired',
          },
        });
      }
      return throwError(() => error);
    }),
  );
};
