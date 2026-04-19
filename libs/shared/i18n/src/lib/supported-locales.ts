export type SupportedLocale = 'en' | 'pt';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'pt'] as const;

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const LOCALE_STORAGE_KEY = 'mc.locale';
