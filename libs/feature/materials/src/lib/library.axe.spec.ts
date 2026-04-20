import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLiveAnnouncer } from '@shared/a11y';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { LibraryComponent } from './library.component';
import { provideMaterials } from './providers';

function mount() {
  const fixture = TestBed.createComponent(LibraryComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('axe — Materials Library (SEV-31)', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [LibraryComponent],
      providers: [provideRouter([]), provideLiveAnnouncer(), ...provideMaterials()]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-library').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('Library has no axe violations (en)', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = mount();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
