import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';

import { I18nService, detectBrowserLocale } from './i18n.service';
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
  it('maps any pt-* browser locale to pt', () => {
    expect(detectBrowserLocale('pt-BR')).toBe('pt');
    expect(detectBrowserLocale('pt')).toBe('pt');
    expect(detectBrowserLocale('PT-br')).toBe('pt');
  });

  it('falls back to en for everything else', () => {
    expect(detectBrowserLocale('en-US')).toBe('en');
    expect(detectBrowserLocale('fr-FR')).toBe('en');
    expect(detectBrowserLocale('')).toBe('en');
    expect(detectBrowserLocale(undefined)).toBe('en');
    expect(detectBrowserLocale(null)).toBe('en');
  });
});

describe('I18nService', () => {
  function configure(opts: Parameters<typeof createFakeDocument>[0]) {
    const { doc, root, store } = createFakeDocument(opts);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: doc }]
    });
    const service = TestBed.inject(I18nService);
    return { service, root, store };
  }

  it('detects pt from navigator when nothing is stored', () => {
    const { service, root } = configure({ navigatorLanguage: 'pt-BR' });
    expect(service.locale()).toBe('pt');
    expect(root.getAttribute('lang')).toBe('pt');
  });

  it('prefers stored locale over navigator', () => {
    const { service } = configure({ navigatorLanguage: 'en-US', initialStored: 'pt' });
    expect(service.locale()).toBe('pt');
  });

  it('persists the selected locale to storage and applies lang attr', () => {
    const { service, root, store } = configure({ navigatorLanguage: 'en-US' });
    service.setLocale('pt');
    expect(service.locale()).toBe('pt');
    expect(root.getAttribute('lang')).toBe('pt');
    expect(store.get(LOCALE_STORAGE_KEY)).toBe('pt');
  });

  it('ignores unsupported locales', () => {
    const { service } = configure({ navigatorLanguage: 'en' });
    service.setLocale('xx' as 'en');
    expect(service.locale()).toBe('en');
  });

  it('returns translated strings for both locales', () => {
    const { service } = configure({ navigatorLanguage: 'en' });
    expect(service.t('home.title')).toBe('Welcome back.');
    service.setLocale('pt');
    expect(service.t('home.title')).toBe('Bem-vindo de volta.');
  });

  it('survives when storage is unavailable', () => {
    const { service } = configure({ navigatorLanguage: 'pt', storageAvailable: false });
    expect(service.locale()).toBe('pt');
    expect(() => service.setLocale('en')).not.toThrow();
    expect(service.locale()).toBe('en');
  });
});
