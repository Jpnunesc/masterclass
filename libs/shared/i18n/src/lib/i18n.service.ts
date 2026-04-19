import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';

import { MESSAGES, type I18nKey, type MessageCatalog } from './messages';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type SupportedLocale
} from './supported-locales';

export type I18nParams = Readonly<Record<string, string | number>>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly doc = inject(DOCUMENT);
  private readonly storage = this.safeStorage();
  private readonly warned = new Set<string>();

  readonly locale = signal<SupportedLocale>(this.resolveInitial());
  readonly catalog = computed<MessageCatalog>(() => MESSAGES[this.locale()]);

  constructor() {
    this.applyLang(this.locale());
  }

  setLocale(locale: SupportedLocale): void {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) return;
    if (this.locale() === locale) return;
    this.locale.set(locale);
    this.applyLang(locale);
    try {
      this.storage?.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* storage may be blocked; live switching still works in-memory */
    }
  }

  t(key: I18nKey, params?: I18nParams): string {
    const current = this.catalog()[key];
    const fallback = MESSAGES[DEFAULT_LOCALE][key];
    const msg = current ?? fallback;
    if (msg === undefined) {
      this.reportMissing(key, this.locale());
      return key;
    }
    if (current === undefined) this.reportMissing(key, this.locale());
    return params ? interpolate(msg, params) : msg;
  }

  private reportMissing(key: string, locale: SupportedLocale): void {
    if (!isDevMode()) return;
    const tag = `${locale}:${key}`;
    if (this.warned.has(tag)) return;
    this.warned.add(tag);
    // eslint-disable-next-line no-console
    console.warn(`[i18n] missing translation for "${key}" in locale "${locale}"`);
  }

  private applyLang(locale: SupportedLocale): void {
    this.doc.documentElement.setAttribute('lang', locale);
  }

  private resolveInitial(): SupportedLocale {
    const stored = this.storage?.getItem(LOCALE_STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      return stored as SupportedLocale;
    }
    return detectBrowserLocale(this.doc.defaultView?.navigator?.language);
  }

  private safeStorage(): Storage | null {
    try {
      return this.doc.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}

export function detectBrowserLocale(nav: string | undefined | null): SupportedLocale {
  const lower = (nav ?? '').toLowerCase();
  return lower.startsWith('pt') ? 'pt' : 'en';
}

function interpolate(template: string, params: I18nParams): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k];
    return v === undefined ? `{${k}}` : String(v);
  });
}
