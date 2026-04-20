import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { ProfileComponent } from './profile.component';

function mount() {
  const fixture = TestBed.createComponent(ProfileComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('axe — Profile (SEV-31)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-profile').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('Profile has no axe violations (en)', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = mount();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('Profile has no axe violations (pt-BR)', async () => {
    TestBed.inject(I18nService).setLocale('pt-BR');
    const fixture = mount();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
