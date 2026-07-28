import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { rethrowPublicApiError } from './public-api-error';
import { PublicProfile } from './public-api.models';
import { PUBLIC_API_BASE_URL } from './public-api.tokens';

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly baseUrl = inject(PUBLIC_API_BASE_URL);
  private readonly http = inject(HttpClient);

  get(): Observable<PublicProfile> {
    return this.http
      .get<PublicProfile>(`${this.baseUrl}/profile`)
      .pipe(catchError(rethrowPublicApiError));
  }
}
