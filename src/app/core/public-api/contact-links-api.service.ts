import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { rethrowPublicApiError } from './public-api-error';
import { PublicContactLink } from './public-api.models';
import { PUBLIC_API_BASE_URL } from './public-api.tokens';

@Injectable({ providedIn: 'root' })
export class ContactLinksApiService {
  private readonly baseUrl = inject(PUBLIC_API_BASE_URL);
  private readonly http = inject(HttpClient);

  list(): Observable<PublicContactLink[]> {
    return this.http
      .get<PublicContactLink[]>(`${this.baseUrl}/contact-links`)
      .pipe(catchError(rethrowPublicApiError));
  }
}
