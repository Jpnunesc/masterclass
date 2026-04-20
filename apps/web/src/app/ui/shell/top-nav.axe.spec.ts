import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { TopNavComponent } from './top-nav.component';

async function renderIntoDocument() {
  const fixture = TestBed.createComponent(TopNavComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('axe — SEV-39 top-nav brand link', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopNavComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-top-nav').forEach((n) => n.remove());
  });

  for (const locale of ['en', 'pt-BR'] as const) {
    it(`brand link: aria-label contains visible wordmark, mark is decorative (${locale})`, async () => {
      TestBed.inject(I18nService).setLocale(locale);
      const fixture = await renderIntoDocument();
      const host = fixture.nativeElement as HTMLElement;

      const brand = host.querySelector('.mc-topnav__brand') as HTMLAnchorElement | null;
      expect(brand).toBeTruthy();

      // Structural guard: the product-mark inside the link must be decorative,
      // otherwise its role="img" aria-label duplicates the wordmark and axe's
      // subtreeText becomes "MasterClass MasterClass" — a label-in-name mismatch.
      const markInsideLink = brand!.querySelector('mc-product-mark');
      expect(markInsideLink?.getAttribute('aria-hidden')).toBe('true');

      // WCAG 2.5.3 Label in Name: the accessible name must contain the visible text.
      const accName = (brand!.getAttribute('aria-label') ?? '').toLowerCase();
      const visibleText = (
        brand!.querySelector('.mc-topnav__wordmark')?.textContent ?? ''
      )
        .trim()
        .toLowerCase();
      expect(visibleText.length).toBeGreaterThan(0);
      expect(accName.includes(visibleText)).toBe(true);

      const results = await runAxe(host);
      const offending = results.violations.filter(
        (v) => v.id === 'label-content-name-mismatch'
      );
      expect(offending).toEqual([]);
      expectNoAxeViolations(results);
    });
  }
});
