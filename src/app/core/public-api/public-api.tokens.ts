import { InjectionToken } from '@angular/core';

export const PUBLIC_API_BASE_URL = new InjectionToken<string>('PUBLIC_API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api/v1',
});
