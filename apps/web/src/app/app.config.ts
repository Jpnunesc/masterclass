import { ApplicationConfig, LOCALE_ID, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localePtBr from '@angular/common/locales/pt';
import { I18nService } from '@shared/i18n';
import { provideLiveAnnouncer } from '@shared/a11y';
import { provideApi } from '@shared/api';

import { APP_ROUTES } from './app.routes';
import { resolveApiBaseUrl } from './api-base-url';

registerLocaleData(localeEn, 'en');
registerLocaleData(localePtBr, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideLiveAnnouncer(),
    provideApi({ baseUrl: resolveApiBaseUrl() }),
    {
      provide: LOCALE_ID,
      useFactory: () => inject(I18nService).locale()
    }
  ]
};
