import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { rethrowPublicApiError } from './public-api-error';
import { contentListParams } from './public-api-params';
import { ContentListQuery, PageResponse, PublicProject } from './public-api.models';
import { PUBLIC_API_BASE_URL } from './public-api.tokens';

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly baseUrl = inject(PUBLIC_API_BASE_URL);
  private readonly http = inject(HttpClient);

  list(query: ContentListQuery = {}): Observable<PageResponse<PublicProject>> {
    return this.http
      .get<PageResponse<PublicProject>>(`${this.baseUrl}/projects`, {
        params: contentListParams(query),
      })
      .pipe(catchError(rethrowPublicApiError));
  }

  get(slug: string): Observable<PublicProject> {
    return this.http
      .get<PublicProject>(`${this.baseUrl}/projects/${encodeURIComponent(slug)}`)
      .pipe(catchError(rethrowPublicApiError));
  }
}
