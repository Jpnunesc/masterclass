import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { LIVE_ANNOUNCER } from '@shared/a11y';

import { MESSAGES, type I18nKey, type MessageCatalog } from './messages';
import {
  DEFAULT_LOCALE,
  LEGACY_LOCALE_ALIASES,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type SupportedLocale
} from './supported-locales';

export type I18nParamValue = string | number;
export type I18nParams = Readonly<Record<string, I18nParamValue>>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly doc = inject(DOCUMENT);
  private readonly announcer = inject(LIVE_ANNOUNCER, { optional: true });
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
    this.announcer?.announce(
      this.t('common.locale.current', { locale }),
      'polite'
    );
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
    return params ? formatMessage(msg, params) : msg;
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
    if (stored) {
      const canonical = canonicalizeStored(stored);
      if (canonical) {
        if (canonical !== stored) {
          try {
            this.storage?.setItem(LOCALE_STORAGE_KEY, canonical);
          } catch {
            /* ignore — migration is best-effort */
          }
        }
        return canonical;
      }
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
  return lower.startsWith('pt') ? 'pt-BR' : 'en';
}

function canonicalizeStored(value: string): SupportedLocale | null {
  if ((SUPPORTED_LOCALES as readonly string[]).includes(value)) {
    return value as SupportedLocale;
  }
  const aliased = LEGACY_LOCALE_ALIASES[value];
  return aliased ?? null;
}

/**
 * Minimal ICU-style formatter. Supports `{name}` placeholders,
 * `{name, select, case {value} ... other {value}}`, and
 * `{name, plural, one {# lesson} other {# lessons}}`. `#` inside a plural
 * branch is replaced by the numeric value. EN uses `one`/`other` and PT-BR
 * collapses to `other` for anything ≥2 — we keep the rules minimal since
 * the MasterClass catalog only needs EN + PT-BR plural forms.
 */
export function formatMessage(template: string, params: I18nParams): string {
  return formatInternal(template, params, null);
}

function formatInternal(
  template: string,
  params: I18nParams,
  pluralValue: number | null
): string {
  let out = '';
  let i = 0;
  while (i < template.length) {
    const ch = template[i];
    if (ch === '#' && pluralValue !== null) {
      out += String(pluralValue);
      i++;
      continue;
    }
    if (ch === '{') {
      const end = findClosingBrace(template, i);
      if (end === -1) {
        out += ch;
        i++;
        continue;
      }
      out += resolveArg(template.slice(i + 1, end), params, pluralValue);
      i = end + 1;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

function resolveArg(
  inner: string,
  params: I18nParams,
  pluralValue: number | null
): string {
  const selectMatch = /^(\w+)\s*,\s*select\s*,\s*([\s\S]*)$/.exec(inner);
  if (selectMatch) {
    const [, name, body] = selectMatch;
    const raw = params[name];
    const key = raw === undefined ? 'other' : String(raw);
    return resolveSelect(body, key, params);
  }
  const pluralMatch = /^(\w+)\s*,\s*plural\s*,\s*([\s\S]*)$/.exec(inner);
  if (pluralMatch) {
    const [, name, body] = pluralMatch;
    const raw = params[name];
    const value = typeof raw === 'number' ? raw : Number(raw);
    return resolvePlural(body, Number.isFinite(value) ? value : 0, params);
  }
  const name = inner.trim();
  const v = params[name];
  if (v === undefined) {
    return pluralValue !== null && name === '#' ? String(pluralValue) : `{${name}}`;
  }
  return String(v);
}

function resolveSelect(body: string, key: string, params: I18nParams): string {
  const cases = parseCases(body);
  const chosen = cases.get(key) ?? cases.get('other') ?? '';
  return formatInternal(chosen, params, null);
}

function resolvePlural(body: string, value: number, params: I18nParams): string {
  const cases = parseCases(body);
  const exact = cases.get(`=${value}`);
  if (exact !== undefined) return formatInternal(exact, params, value);
  const key = pluralCategory(value);
  const chosen = cases.get(key) ?? cases.get('other') ?? '';
  return formatInternal(chosen, params, value);
}

function pluralCategory(value: number): 'one' | 'other' {
  // EN + PT-BR share the same simple rule for our catalog: 1 → one, else other.
  return Math.abs(value) === 1 ? 'one' : 'other';
}

function parseCases(body: string): Map<string, string> {
  const cases = new Map<string, string>();
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i++;
    if (i >= body.length) break;
    const labelStart = i;
    while (i < body.length && !/\s/.test(body[i]) && body[i] !== '{') i++;
    const label = body.slice(labelStart, i);
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== '{') break;
    const end = findClosingBrace(body, i);
    if (end === -1) break;
    cases.set(label, body.slice(i + 1, end));
    i = end + 1;
  }
  return cases;
}

function findClosingBrace(s: string, start: number): number {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
