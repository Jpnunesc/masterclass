import { ApplicationConfig, LOCALE_ID, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localePt from '@angular/common/locales/pt';
import { I18nService } from '@shared/i18n';

import { APP_ROUTES } from './app.routes';

registerLocaleData(localeEn, 'en');
registerLocaleData(localePt, 'pt');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    {
      provide: LOCALE_ID,
      useFactory: () => inject(I18nService).locale()
    }
  ]
};
