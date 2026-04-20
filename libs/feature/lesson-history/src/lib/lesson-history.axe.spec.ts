import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLiveAnnouncer } from '@shared/a11y';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { LessonHistoryComponent } from './lesson-history.component';
import { provideLessonHistory } from './providers';

function mount() {
  const fixture = TestBed.createComponent(LessonHistoryComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('axe — LessonHistory (SEV-31)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [LessonHistoryComponent],
      providers: [provideRouter([]), provideLiveAnnouncer(), ...provideLessonHistory()]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-lesson-history').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('LessonHistory has no axe violations (en)', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = mount();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
