import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLiveAnnouncer } from '@shared/a11y';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { AssessmentComponent } from './assessment.component';
import { provideAssessmentStubs } from './clients/stub-clients';

function mount() {
  const fixture = TestBed.createComponent(AssessmentComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('axe — Assessment (SEV-31)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [AssessmentComponent],
      providers: [provideRouter([]), provideLiveAnnouncer(), ...provideAssessmentStubs()]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-assessment').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('Assessment has no axe violations (en)', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = mount();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
