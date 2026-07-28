import { inject, Injectable } from '@angular/core';
import { PUBLIC_API_BASE_URL } from './public-api.tokens';

@Injectable({ providedIn: 'root' })
export class MediaUrlService {
  private readonly baseUrl = inject(PUBLIC_API_BASE_URL);

  publicUrl(mediaId: string): string {
    return `${this.baseUrl}/media/${encodeURIComponent(mediaId)}`;
  }
}
