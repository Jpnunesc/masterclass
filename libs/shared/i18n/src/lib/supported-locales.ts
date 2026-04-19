/**
 * Supported UI locales. Translation catalogs ship in SEV-8 (A3); this file owns
 * the shape so app bootstrap + language selector can rely on it now.
 */
export type SupportedLocale = 'en' | 'pt-BR';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'pt-BR'] as const;

export const DEFAULT_LOCALE: SupportedLocale = 'en';
