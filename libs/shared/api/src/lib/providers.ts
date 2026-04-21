import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { API_CONFIG, ApiConfig } from './api-config';
import { authInterceptor } from './auth.interceptor';

export function provideApi(config: ApiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: API_CONFIG, useValue: config },
    provideHttpClient(withInterceptors([authInterceptor]))
  ]);
}
