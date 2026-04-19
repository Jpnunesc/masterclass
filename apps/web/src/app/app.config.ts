import { ApplicationConfig, LOCALE_ID, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localePtBr from '@angular/common/locales/pt';
import { I18nService } from '@shared/i18n';
import { provideLiveAnnouncer } from '@shared/a11y';

import { APP_ROUTES } from './app.routes';

registerLocaleData(localeEn, 'en');
registerLocaleData(localePtBr, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideLiveAnnouncer(),
    {
      provide: LOCALE_ID,
      useFactory: () => inject(I18nService).locale()
    }
  ]
};
