export type SupportedLocale = 'en' | 'pt-BR';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['en', 'pt-BR'] as const;

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const LOCALE_STORAGE_KEY = 'mc.locale';

export const LEGACY_LOCALE_ALIASES: Readonly<Record<string, SupportedLocale>> = {
  pt: 'pt-BR'
};
