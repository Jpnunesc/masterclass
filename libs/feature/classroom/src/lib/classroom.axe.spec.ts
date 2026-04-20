import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { ClassroomComponent } from './classroom.component';
import { ClassroomStatesGalleryComponent } from './states-gallery.component';

function activatedRouteStub(sessionId = 'demo') {
  return {
    snapshot: {
      paramMap: convertToParamMap({ sessionId })
    }
  };
}

function renderIntoDocument<T>(component: new (...args: unknown[]) => T) {
  const fixture = TestBed.createComponent(component);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  fixture.detectChanges();
  return fixture;
}

afterEach(() => {
  document
    .querySelectorAll('mc-classroom, mc-classroom-states-gallery')
    .forEach((n) => n.remove());
  document.getElementById('mc-live-announcer')?.remove();
});

describe('axe — Classroom (SEV-31)', () => {
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });
  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

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
  });

  it('Classroom shell has no axe violations (en)', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = renderIntoDocument(ClassroomComponent);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('Classroom shell has no axe violations (pt-BR)', async () => {
    TestBed.inject(I18nService).setLocale('pt-BR');
    const fixture = renderIntoDocument(ClassroomComponent);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});

describe('axe — Classroom states gallery (SEV-31)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [ClassroomStatesGalleryComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('renders 8 avatar + 7 mic states with no axe violations', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = renderIntoDocument(ClassroomStatesGalleryComponent);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('mc-avatar').length).toBe(8);
    expect(el.querySelectorAll('mc-mic-button').length).toBe(7);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
