import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { rethrowPublicApiError } from './public-api-error';
import { contentListParams } from './public-api-params';
import { ContentListQuery, PageResponse, PublicPost } from './public-api.models';
import { PUBLIC_API_BASE_URL } from './public-api.tokens';

@Injectable({ providedIn: 'root' })
export class PostsApiService {
  private readonly baseUrl = inject(PUBLIC_API_BASE_URL);
  private readonly http = inject(HttpClient);

  list(query: ContentListQuery = {}): Observable<PageResponse<PublicPost>> {
    return this.http
      .get<PageResponse<PublicPost>>(`${this.baseUrl}/posts`, {
        params: contentListParams(query),
      })
      .pipe(catchError(rethrowPublicApiError));
  }

  get(slug: string): Observable<PublicPost> {
    return this.http
      .get<PublicPost>(`${this.baseUrl}/posts/${encodeURIComponent(slug)}`)
      .pipe(catchError(rethrowPublicApiError));
  }
}
