import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { provideAssessmentStubs } from '@feature/assessment';

import { provideLessonStubs } from './clients/stub-clients';
import { LessonPreviewComponent } from './lesson.component';

function mount() {
  const fixture = TestBed.createComponent(LessonPreviewComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('axe — Lesson preview (SEV-31)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [LessonPreviewComponent],
      providers: [provideRouter([]), ...provideAssessmentStubs(), ...provideLessonStubs()]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-lesson-preview').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('Lesson preview has no axe violations (en)', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = mount();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
