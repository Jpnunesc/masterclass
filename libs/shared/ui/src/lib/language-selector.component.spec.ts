import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { I18nService } from '@shared/i18n';

import { LanguageSelectorComponent } from './language-selector.component';

describe('LanguageSelectorComponent', () => {
  let doc: Document;

  beforeEach(() => {
    doc = document;
    doc.documentElement.removeAttribute('lang');
    localStorage.removeItem('mc.locale');
    TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent],
      providers: [{ provide: DOCUMENT, useValue: doc }]
    });
  });

  it('renders the current locale code on the pill trigger', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.mc-lang__trigger') as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    expect(trigger.textContent?.trim()).toContain('EN');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the popover on trigger click and exposes aria-expanded=true', () => {
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.mc-lang__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const menu = fixture.nativeElement.querySelector('.mc-lang__menu');
    expect(menu).toBeTruthy();
    const items = menu.querySelectorAll('.mc-lang__item');
    expect(items.length).toBe(2);
  });

  it('switches I18nService locale when the user picks a language item', () => {
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.mc-lang__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const ptItem = Array.from(
      fixture.nativeElement.querySelectorAll('.mc-lang__item')
    ).find((el) => (el as HTMLElement).textContent?.includes('Português')) as HTMLButtonElement;
    ptItem.click();
    fixture.detectChanges();

    expect(i18n.locale()).toBe('pt');
    expect(doc.documentElement.getAttribute('lang')).toBe('pt');
  });

  it('keeps item labels in their native script regardless of UI locale', () => {
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    const i18n = TestBed.inject(I18nService);

    i18n.setLocale('pt');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.mc-lang__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const items = Array.from(fixture.nativeElement.querySelectorAll('.mc-lang__item'))
      .map((el) => (el as HTMLElement).textContent?.trim())
      .join(' | ');
    expect(items).toContain('English');
    expect(items).toContain('Português (Brasil)');
  });
});
