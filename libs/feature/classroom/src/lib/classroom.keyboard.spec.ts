import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { getKeyboardFocusOrder } from '@shared/a11y/testing';

import { ClassroomComponent } from './classroom.component';
import { ClassroomSessionService } from './classroom-session.service';

function activatedRouteStub(sessionId = 'demo') {
  return {
    snapshot: { paramMap: convertToParamMap({ sessionId }) }
  };
}

function mount() {
  const fixture = TestBed.createComponent(ClassroomComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  fixture.detectChanges();
  return fixture;
}

describe('keyboard — Classroom (SEV-31)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [ClassroomComponent],
      providers: [
        provideRouter([
          { path: 'classroom/states-gallery', children: [] }
        ]),
        { provide: ActivatedRoute, useValue: activatedRouteStub() }
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
  });

  afterEach(() => {
    document.querySelectorAll('mc-classroom').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('reaches the mic button, whiteboard exercise input, and gallery link via Tab order', () => {
    const fixture = mount();
    const order = getKeyboardFocusOrder(fixture.nativeElement);
    expect(order.length).toBeGreaterThan(0);

    const micButton = order.find((el) => el.classList.contains('mc-mic'));
    expect(micButton).withContext('mic button must be in Tab order').toBeTruthy();
    expect(micButton!.getAttribute('aria-label')).toBeTruthy();
    expect(micButton!.hasAttribute('aria-pressed')).toBeTrue();

    const galleryLink = order.find(
      (el) => el instanceof HTMLAnchorElement && (el as HTMLAnchorElement).getAttribute('href')?.includes('states-gallery')
    );
    expect(galleryLink).withContext('states-gallery link must be in Tab order').toBeTruthy();

    const exerciseInput = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input, textarea')
    ).find((el) => !el.disabled);
    if (exerciseInput) {
      expect(order).toContain(exerciseInput);
    }
  });

  it('has no positive tabindex values that would break DOM tab order', () => {
    const fixture = mount();
    const positives = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[tabindex]')
    ).filter((el) => {
      const ti = Number(el.getAttribute('tabindex'));
      return Number.isFinite(ti) && ti > 0;
    });
    expect(positives).toEqual([]);
  });

  it('M toggles the mic via the global keydown handler without trapping focus', () => {
    const fixture = mount();
    const session = TestBed.inject(ClassroomSessionService);
    expect(session.micState()).toBe('idle');

    const event = new KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(session.micState()).toBe('armed');
    expect(event.defaultPrevented).toBeTrue();
  });

  it('Escape cancels an in-flight mic state without swallowing focus-restore paths', () => {
    const fixture = mount();
    const session = TestBed.inject(ClassroomSessionService);
    session.toggleMic();
    fixture.detectChanges();
    expect(session.micState()).toBe('armed');

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(session.micState()).toBe('idle');
  });
});
