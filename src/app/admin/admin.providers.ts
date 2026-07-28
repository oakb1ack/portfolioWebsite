import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { adminHttpInterceptor } from './core/admin-http.interceptor';

export function provideAdminApi(): EnvironmentProviders {
  return makeEnvironmentProviders([provideHttpClient(withInterceptors([adminHttpInterceptor]))]);
}
