import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';

import { SessionInfo } from './admin.models';

const AUTH_URL = '/api/v1/auth';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionState = signal<SessionInfo | null>(null);
  private restoreRequest?: Observable<boolean>;
  private csrfRequest?: Observable<string>;
  private csrfValue?: string;

  readonly authenticated = computed(() => this.sessionState()?.authenticated === true);
  readonly expiresAt = computed(() => this.sessionState()?.expires_at ?? null);

  restoreSession(force = false): Observable<boolean> {
    if (!force && this.sessionState() !== null) {
      return of(this.authenticated());
    }
    if (!force && this.restoreRequest) {
      return this.restoreRequest;
    }

    const request = this.http
      .get<SessionInfo>(`${AUTH_URL}/session`, { withCredentials: true })
      .pipe(
        tap((session) => this.sessionState.set(session)),
        map((session) => session.authenticated),
        catchError(() => {
          this.clearLocalSession();
          return of(false);
        }),
        finalize(() => {
          this.restoreRequest = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.restoreRequest = request;
    return request;
  }

  login(username: string, password: string): Observable<void> {
    return this.http
      .post<SessionInfo>(
        `${AUTH_URL}/login`,
        { username: username.trim(), password },
        { withCredentials: true },
      )
      .pipe(
        tap((session) => {
          this.csrfValue = undefined;
          this.sessionState.set(session);
        }),
        map(() => undefined),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${AUTH_URL}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(undefined)),
      tap(() => this.clearLocalSession()),
    );
  }

  csrfToken(force = false): Observable<string> {
    if (!force && this.csrfValue) {
      return of(this.csrfValue);
    }
    if (!force && this.csrfRequest) {
      return this.csrfRequest;
    }

    const request = this.http
      .get<{ csrf_token: string }>(`${AUTH_URL}/csrf`, { withCredentials: true })
      .pipe(
        map((result) => result.csrf_token),
        tap((token) => (this.csrfValue = token)),
        finalize(() => {
          this.csrfRequest = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.csrfRequest = request;
    return request;
  }

  clearLocalSession(): void {
    this.csrfValue = undefined;
    this.csrfRequest = undefined;
    this.sessionState.set({ authenticated: false });
  }
}
