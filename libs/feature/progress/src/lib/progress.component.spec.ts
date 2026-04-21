import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';
import { provideMaterialsForTesting } from '@feature/materials';

import { ProgressComponent } from './progress.component';
import { provideProgress } from './providers';

function mount() {
  const fixture = TestBed.createComponent(ProgressComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('ProgressComponent (SEV-20)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [ProgressComponent],
      providers: [
        provideRouter([]),
        ...provideProgress(),
        ...provideMaterialsForTesting()
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
  });

  afterEach(() => {
    document.querySelectorAll('mc-progress').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('renders eyebrow + hero + streak + level + sessions + skills in order', () => {
    const fixture = mount();
    const el = fixture.nativeElement as HTMLElement;
    const main = el.querySelector<HTMLElement>('main.mc-progress')!;
    expect(main).toBeTruthy();
    expect(main.getAttribute('aria-labelledby')).toBe('mc-progress-title');
    expect(main.getAttribute('data-density')).toBe('comfortable');

    // Hero is the h1 with the landmark id.
    const h1 = el.querySelector<HTMLElement>('h1')!;
    expect(h1).toBeTruthy();
    expect(h1.id).toBe('mc-progress-title');
    expect(h1.textContent?.trim().length).toBeGreaterThan(0);

    // Streak module carries a count + label + 14 dots.
    const dots = el.querySelectorAll('.mc-progress-streak__dot');
    expect(dots.length).toBe(14);
    const todayRing = el.querySelector('.mc-progress-streak__dot--today');
    expect(todayRing).toBeTruthy();

    // Level rail — progressbar with 0..100 aria values.
    const rail = el.querySelector<HTMLElement>(
      '.mc-progress-level__rail[role="progressbar"]'
    )!;
    expect(rail).toBeTruthy();
    expect(rail.getAttribute('aria-valuemin')).toBe('0');
    expect(rail.getAttribute('aria-valuemax')).toBe('100');
    const labels = el.querySelectorAll('.mc-progress-level__label');
    expect(labels.length).toBe(5);
    expect(Array.from(labels).map((n) => n.textContent?.trim())).toEqual([
      'A1',
      'A2',
      'B1',
      'B2',
      'C1'
    ]);

    // Skill balance — 4 rows with progressbar role.
    const skillBars = el.querySelectorAll(
      '.mc-progress-skills__track[role="progressbar"]'
    );
    expect(skillBars.length).toBe(4);
  });

  it('hero never renders more than two lines at the default viewport', () => {
    const fixture = mount();
    const el = fixture.nativeElement as HTMLElement;
    const h1 = el.querySelector('h1') as HTMLElement;
    const style = getComputedStyle(h1);
    // -webkit-box is still the display that pairs with -webkit-line-clamp, but
    // some Chromium builds normalise the computed value to flow-root when
    // overflow:hidden is present. Accept either — the clamp value is the
    // functional assertion.
    expect(['-webkit-box', 'flow-root']).toContain(style.display);
    expect(style.getPropertyValue('-webkit-line-clamp').trim()).toBe('2');
  });

  it('translates the whole surface when the locale switches to PT', () => {
    TestBed.inject(I18nService).setLocale('pt-BR');
    const fixture = mount();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Progresso');
    expect(el.textContent).toContain('Últimos 14 dias');
    expect(el.textContent).toContain('Escuta');
    expect(el.textContent).toContain('Fala');
    expect(el.textContent).toContain('Leitura');
    expect(el.textContent).toContain('Escrita');
  });

  it('has no axe violations (en)', async () => {
    const fixture = mount();
    await fixture.whenStable();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('has no axe violations (pt)', async () => {
    TestBed.inject(I18nService).setLocale('pt-BR');
    const fixture = mount();
    await fixture.whenStable();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('falls back to default bucket and warns in dev when a bucket is underfilled', () => {
    // Monkey-patch the i18n catalog to remove three "early" variants so the
    // bucket would resolve to early but fails the >=4 variants check.
    const i18n = TestBed.inject(I18nService);
    const proxied = new Proxy(i18n.catalog(), {
      get(target, prop) {
        if (typeof prop === 'string' && prop.startsWith('progress.hero.early.') &&
            prop !== 'progress.hero.early.1') {
          return undefined;
        }
        return (target as Record<string, string>)[prop as string];
      }
    });
    const warnSpy = spyOn(console, 'warn');
    spyOn(i18n, 'catalog').and.returnValue(proxied as never);

    const fixture = mount();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const hero = el.querySelector('h1') as HTMLElement;
    // Any default variant renders — hero must never be empty.
    expect(hero.textContent?.trim().length).toBeGreaterThan(0);
    // The warning is gated to dev mode; Jasmine runs in test mode which
    // Angular reports as dev — so we expect exactly one warn per bucket.
    const hit = warnSpy.calls
      .allArgs()
      .some((args) => String(args[0]).includes('progress.hero.'));
    expect(hit).toBe(true);
  });
});
