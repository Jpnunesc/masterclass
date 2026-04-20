import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { getKeyboardFocusOrder } from '@shared/a11y/testing';

import { AppComponent } from './app.component';
import { BreakpointService } from './ui/shell';

class DesktopBreakpointStub {
  readonly atLeastLg = () => true;
}

describe('keyboard-only navigation smoke test', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: BreakpointService, useClass: DesktopBreakpointStub }
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
  });

  afterEach(() => {
    document.querySelectorAll('mc-root').forEach((n) => n.remove());
  });

  it('exposes a skip-link as the first tab stop and reaches every primary nav link', () => {
    const fixture = TestBed.createComponent(AppComponent);
    document.body.appendChild((fixture.nativeElement as HTMLElement));
    fixture.detectChanges();

    const order = getKeyboardFocusOrder((fixture.nativeElement as HTMLElement));
    expect(order.length).toBeGreaterThan(0);

    const first = order[0];
    expect(first.classList.contains('mc-skip-link')).toBeTrue();
    expect(first.getAttribute('href')).toBe('#main');

    const textContent = order.map((el) => el.textContent?.trim()).join(' | ');
    ['Classroom', 'Materials', 'Progress'].forEach((label) => {
      expect(textContent).toContain(label);
    });

    const main = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#main');
    expect(main?.getAttribute('tabindex')).toBe('-1');

    main?.focus();
    expect(document.activeElement).toBe(main);
  });

  it('has no positive tabindex values that would break DOM tab order', () => {
    const fixture = TestBed.createComponent(AppComponent);
    document.body.appendChild((fixture.nativeElement as HTMLElement));
    fixture.detectChanges();

    const positives = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[tabindex]')).filter((el) => {
      const ti = Number(el.getAttribute('tabindex'));
      return Number.isFinite(ti) && ti > 0;
    });
    expect(positives).toEqual([]);
  });
});
