import enMessages from './locales/en.json';
import ptMessages from './locales/pt.json';
import { type SupportedLocale } from './supported-locales';

/**
 * Typed message key union, inferred from the EN catalog. The EN bundle is the
 * source of truth; PT parity is enforced by `tools/check-i18n.mjs` in CI.
 */
export type I18nKey = keyof typeof enMessages;

export type MessageCatalog = Readonly<Record<I18nKey, string>>;

export const MESSAGES: Readonly<Record<SupportedLocale, MessageCatalog>> = {
  en: enMessages,
  pt: ptMessages as MessageCatalog
};
