import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { I18nService } from '@shared/i18n';

import { LanguageSelectorComponent } from './language-selector.component';

describe('LanguageSelectorComponent', () => {
  let doc: Document;

  beforeEach(() => {
    doc = document;
    // Ensure the real document has a clean lang + clean storage for isolation.
    doc.documentElement.removeAttribute('lang');
    localStorage.removeItem('mc.locale');
    TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent],
      providers: [{ provide: DOCUMENT, useValue: doc }]
    });
  });

  it('switches the I18nService locale when the user picks a language', () => {
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    const i18n = TestBed.inject(I18nService);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select).toBeTruthy();

    select.value = 'pt';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(i18n.locale()).toBe('pt');
    expect(doc.documentElement.getAttribute('lang')).toBe('pt');
  });

  it('rerenders selector labels live when locale changes (no reload)', () => {
    const fixture = TestBed.createComponent(LanguageSelectorComponent);
    const i18n = TestBed.inject(I18nService);

    i18n.setLocale('en');
    fixture.detectChanges();
    const labelInEn = fixture.nativeElement.querySelector('.mc-caption').textContent.trim();
    expect(labelInEn).toBe('Language');

    i18n.setLocale('pt');
    fixture.detectChanges();
    const labelInPt = fixture.nativeElement.querySelector('.mc-caption').textContent.trim();
    expect(labelInPt).toBe('Idioma');
  });
});
