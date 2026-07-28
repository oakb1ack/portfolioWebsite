import '@angular/compiler';

import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminAuthService } from './admin-auth.service';
import { adminHttpInterceptor } from './admin-http.interceptor';

describe('adminHttpInterceptor', () => {
  let injector: ReturnType<typeof Injector.create> | undefined;

  afterEach(() => {
    injector?.destroy();
    injector = undefined;
  });

  it('adds credentials and the CSRF token to admin mutations', async () => {
    const auth = {
      csrfToken: vi.fn(() => of('csrf-token')),
      clearLocalSession: vi.fn(),
    };
    const router = { url: '/admin/projects', navigate: vi.fn() };
    injector = Injector.create({
      providers: [
        { provide: AdminAuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    let forwarded: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = (request) => {
      forwarded = request;
      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(
      runInInjectionContext(injector, () =>
        adminHttpInterceptor(new HttpRequest('PUT', '/api/v1/admin/projects/project-1', {}), next),
      ),
    );

    expect(auth.csrfToken).toHaveBeenCalledOnce();
    expect(forwarded?.withCredentials).toBe(true);
    expect(forwarded?.headers.get('X-CSRF-Token')).toBe('csrf-token');
  });

  it('does not request a CSRF token for login', async () => {
    const auth = {
      csrfToken: vi.fn(() => of('csrf-token')),
      clearLocalSession: vi.fn(),
    };
    injector = Injector.create({
      providers: [
        { provide: AdminAuthService, useValue: auth },
        { provide: Router, useValue: { url: '/', navigate: vi.fn() } },
      ],
    });
    let forwarded: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = (request) => {
      forwarded = request;
      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(
      runInInjectionContext(injector, () =>
        adminHttpInterceptor(
          new HttpRequest('POST', '/api/v1/auth/login', {
            username: 'admin',
            password: 'secret',
          }),
          next,
        ),
      ),
    );

    expect(auth.csrfToken).not.toHaveBeenCalled();
    expect(forwarded?.withCredentials).toBe(true);
    expect(forwarded?.headers.has('X-CSRF-Token')).toBe(false);
  });

  it('clears local auth and redirects when an admin request returns 401', async () => {
    const auth = {
      csrfToken: vi.fn(() => of('csrf-token')),
      clearLocalSession: vi.fn(),
    };
    const router = {
      url: '/admin/posts',
      navigate: vi.fn(() => Promise.resolve(true)),
    };
    injector = Injector.create({
      providers: [
        { provide: AdminAuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 401 }));

    await expect(
      firstValueFrom(
        runInInjectionContext(injector, () =>
          adminHttpInterceptor(new HttpRequest('GET', '/api/v1/admin/posts'), next),
        ),
      ),
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(auth.clearLocalSession).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login'], {
      queryParams: { returnUrl: '/admin/posts', reason: 'expired' },
    });
  });
});
