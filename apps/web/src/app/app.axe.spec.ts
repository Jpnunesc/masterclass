import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { AppComponent } from './app.component';
import { HomeComponent } from './shell/home.component';

async function renderIntoDocument<T>(component: new (...args: unknown[]) => T) {
  const fixture = TestBed.createComponent(component);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('axe — app shell a11y baseline', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, HomeComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-root, mc-home').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('AppComponent shell has no axe violations (en)', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = await renderIntoDocument(AppComponent);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('AppComponent shell has no axe violations (pt)', async () => {
    TestBed.inject(I18nService).setLocale('pt');
    const fixture = await renderIntoDocument(AppComponent);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('HomeComponent has no axe violations', async () => {
    TestBed.inject(I18nService).setLocale('en');
    const fixture = await renderIntoDocument(HomeComponent);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
