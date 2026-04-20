import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLiveAnnouncer } from '@shared/a11y';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';
import { provideMaterials } from '@feature/materials';

import { ReviewComponent } from './review.component';
import { provideReview } from './providers';

function mount() {
  const fixture = TestBed.createComponent(ReviewComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('axe — Review (SEV-31)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [ReviewComponent],
      providers: [
        provideRouter([]),
        provideLiveAnnouncer(),
        ...provideMaterials(),
        ...provideReview()
      ]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-review').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('Review has no axe violations (en)', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = mount();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
