import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { LIVE_ANNOUNCER, type LiveAnnouncer } from '@shared/a11y';

import { I18nService, detectBrowserLocale, formatMessage } from './i18n.service';
import { LOCALE_STORAGE_KEY } from './supported-locales';

function createFakeDocument(opts: {
  navigatorLanguage?: string;
  initialStored?: string | null;
  storageAvailable?: boolean;
}) {
  const store = new Map<string, string>();
  if (opts.initialStored) store.set(LOCALE_STORAGE_KEY, opts.initialStored);

  const storage: Storage | undefined = opts.storageAvailable === false
    ? undefined
    : ({
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
        clear: () => store.clear(),
        key: () => null,
        length: 0
      } as unknown as Storage);

  const root = {
    attrs: new Map<string, string>(),
    setAttribute(name: string, value: string) { this.attrs.set(name, value); },
    getAttribute(name: string) { return this.attrs.get(name) ?? null; }
  };

  const doc = {
    documentElement: root,
    defaultView: {
      navigator: { language: opts.navigatorLanguage ?? 'en-US' },
      localStorage: storage
    }
  };
  return { doc, root, store };
}

describe('detectBrowserLocale', () => {
  it('maps any pt-* browser locale to pt-BR', () => {
    expect(detectBrowserLocale('pt-BR')).toBe('pt-BR');
    expect(detectBrowserLocale('pt')).toBe('pt-BR');
    expect(detectBrowserLocale('PT-br')).toBe('pt-BR');
  });

  it('falls back to en for everything else', () => {
    expect(detectBrowserLocale('en-US')).toBe('en');
    expect(detectBrowserLocale('fr-FR')).toBe('en');
    expect(detectBrowserLocale('')).toBe('en');
    expect(detectBrowserLocale(undefined)).toBe('en');
    expect(detectBrowserLocale(null)).toBe('en');
  });
});

describe('formatMessage', () => {
  it('substitutes simple placeholders', () => {
    expect(formatMessage('Hello {name}.', { name: 'Ana' })).toBe('Hello Ana.');
  });

  it('leaves unknown placeholders intact', () => {
    expect(formatMessage('{a}/{b}', { a: 'x' })).toBe('x/{b}');
  });

  it('resolves ICU select with known key', () => {
    const tmpl = 'Language: {locale, select, en {English} pt-BR {Portuguese} other {Unknown}}';
    expect(formatMessage(tmpl, { locale: 'en' })).toBe('Language: English');
    expect(formatMessage(tmpl, { locale: 'pt-BR' })).toBe('Language: Portuguese');
  });

  it('falls back to the other branch for unknown select keys', () => {
    const tmpl = '{locale, select, en {E} other {?}}';
    expect(formatMessage(tmpl, { locale: 'fr' })).toBe('?');
  });

  it('interpolates inside a select branch', () => {
    const tmpl = '{locale, select, en {Hi {name}} other {Olá {name}}}';
    expect(formatMessage(tmpl, { locale: 'en', name: 'Ana' })).toBe('Hi Ana');
    expect(formatMessage(tmpl, { locale: 'pt-BR', name: 'Ana' })).toBe('Olá Ana');
  });

  it('resolves ICU plural with one / other categories', () => {
    const tmpl = '{count, plural, one {# lesson} other {# lessons}}';
    expect(formatMessage(tmpl, { count: 1 })).toBe('1 lesson');
    expect(formatMessage(tmpl, { count: 5 })).toBe('5 lessons');
    expect(formatMessage(tmpl, { count: 0 })).toBe('0 lessons');
  });

  it('prefers =N exact-match plural branches over category', () => {
    const tmpl = '{count, plural, =0 {no lessons} one {# lesson} other {# lessons}}';
    expect(formatMessage(tmpl, { count: 0 })).toBe('no lessons');
    expect(formatMessage(tmpl, { count: 1 })).toBe('1 lesson');
    expect(formatMessage(tmpl, { count: 3 })).toBe('3 lessons');
  });

  it('composes plural inside a larger template', () => {
    const tmpl = '{count, plural, one {# lesson} other {# lessons}} · {inProgress, plural, one {# in progress} other {# in progress}}';
    expect(formatMessage(tmpl, { count: 1, inProgress: 2 })).toBe('1 lesson · 2 in progress');
    expect(formatMessage(tmpl, { count: 12, inProgress: 1 })).toBe('12 lessons · 1 in progress');
  });
});

describe('I18nService', () => {
  class FakeAnnouncer implements LiveAnnouncer {
    readonly calls: Array<{ message: string; politeness: 'polite' | 'assertive' | undefined }> = [];
    announce(message: string, politeness?: 'polite' | 'assertive'): void {
      this.calls.push({ message, politeness });
    }
  }

  function configure(
    opts: Parameters<typeof createFakeDocument>[0] & { announcer?: LiveAnnouncer }
  ) {
    const { doc, root, store } = createFakeDocument(opts);
    TestBed.resetTestingModule();
    const providers: Array<{ provide: unknown; useValue: unknown }> = [
      { provide: DOCUMENT, useValue: doc }
    ];
    if (opts.announcer) providers.push({ provide: LIVE_ANNOUNCER, useValue: opts.announcer });
    TestBed.configureTestingModule({ providers });
    const service = TestBed.inject(I18nService);
    return { service, root, store };
  }

  it('detects pt-BR from navigator when nothing is stored', () => {
    const { service, root } = configure({ navigatorLanguage: 'pt-BR' });
    expect(service.locale()).toBe('pt-BR');
    expect(root.getAttribute('lang')).toBe('pt-BR');
  });

  it('prefers stored locale over navigator', () => {
    const { service } = configure({ navigatorLanguage: 'en-US', initialStored: 'pt-BR' });
    expect(service.locale()).toBe('pt-BR');
  });

  it('migrates legacy stored "pt" value to "pt-BR" on first read', () => {
    const { service, store } = configure({ navigatorLanguage: 'en-US', initialStored: 'pt' });
    expect(service.locale()).toBe('pt-BR');
    expect(store.get(LOCALE_STORAGE_KEY)).toBe('pt-BR');
  });

  it('persists the selected locale to storage and applies lang attr', () => {
    const { service, root, store } = configure({ navigatorLanguage: 'en-US' });
    service.setLocale('pt-BR');
    expect(service.locale()).toBe('pt-BR');
    expect(root.getAttribute('lang')).toBe('pt-BR');
    expect(store.get(LOCALE_STORAGE_KEY)).toBe('pt-BR');
  });

  it('ignores unsupported locales', () => {
    const { service } = configure({ navigatorLanguage: 'en' });
    service.setLocale('xx' as 'en');
    expect(service.locale()).toBe('en');
  });

  it('returns translated strings for both locales', () => {
    const { service } = configure({ navigatorLanguage: 'en' });
    expect(service.t('home.title')).toBe('Welcome back.');
    service.setLocale('pt-BR');
    expect(service.t('home.title')).toBe('Bem-vindo de volta.');
  });

  it('resolves common.locale.current via ICU select', () => {
    const { service } = configure({ navigatorLanguage: 'en' });
    expect(service.t('common.locale.current', { locale: 'en' })).toBe('Language: English');
    service.setLocale('pt-BR');
    expect(service.t('common.locale.current', { locale: 'pt-BR' })).toBe('Idioma: Português');
    expect(service.t('common.locale.current', { locale: 'en' })).toBe('Idioma: Inglês');
  });

  it('announces the resolved locale label via LIVE_ANNOUNCER on setLocale', () => {
    const announcer = new FakeAnnouncer();
    const { service } = configure({ navigatorLanguage: 'en', announcer });
    service.setLocale('pt-BR');
    expect(announcer.calls.length).toBe(1);
    expect(announcer.calls[0]).toEqual({ message: 'Idioma: Português', politeness: 'polite' });
  });

  it('survives when storage is unavailable', () => {
    const { service } = configure({ navigatorLanguage: 'pt', storageAvailable: false });
    expect(service.locale()).toBe('pt-BR');
    expect(() => service.setLocale('en')).not.toThrow();
    expect(service.locale()).toBe('en');
  });
});
