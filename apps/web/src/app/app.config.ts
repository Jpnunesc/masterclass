import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localePt from '@angular/common/locales/pt';

import { APP_ROUTES } from './app.routes';

registerLocaleData(localeEn, 'en');
registerLocaleData(localePt, 'pt-BR');

function resolveInitialLocale(): 'en' | 'pt-BR' {
  if (typeof navigator === 'undefined') return 'en';
  const pref = (navigator.language || 'en').toLowerCase();
  return pref.startsWith('pt') ? 'pt-BR' : 'en';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    { provide: LOCALE_ID, useFactory: resolveInitialLocale }
  ]
};
