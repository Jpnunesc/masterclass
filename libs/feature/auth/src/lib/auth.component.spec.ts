import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { AuthComponent } from './auth.component';

function mount() {
  const fixture = TestBed.createComponent(AuthComponent);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('AuthComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [provideRouter([{ path: 'onboarding', children: [] }, { path: 'classroom', children: [] }])]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
  });

  afterEach(() => {
    document.querySelectorAll('mc-auth').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('renders login copy and two rail tabs by default', () => {
    const fixture = mount();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Welcome back.');
    expect(el.textContent).toContain('LOG IN');
    expect(el.textContent).toContain('SIGN UP');
    expect(el.querySelectorAll('[role="tab"]').length).toBe(2);
    expect(el.querySelector<HTMLInputElement>('input[name="email"]')).toBeTruthy();
    expect(el.querySelector<HTMLInputElement>('input[name="name"]')).toBeFalsy();
  });

  it('switches to signup via rail tab and shows the name field', () => {
    const fixture = mount();
    const el = fixture.nativeElement as HTMLElement;
    const tabs = el.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[1].click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Start your first lesson.');
    expect(el.querySelector<HTMLInputElement>('input[name="name"]')).toBeTruthy();
  });

  it('blocks submit when fields are empty', () => {
    const fixture = mount();
    const el = fixture.nativeElement as HTMLElement;
    const submit = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(true);
  });

  it('surfaces inline email-format error on submit', async () => {
    const fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const email = el.querySelector<HTMLInputElement>('input[name="email"]')!;
    const password = el.querySelector<HTMLInputElement>('input[name="password"]')!;
    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    password.value = 'hunter22';
    password.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    const form = el.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(el.textContent).toContain("That email doesn't look right.");
  });

  it('routes to /onboarding after signup success', async () => {
    const fixture = mount();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const email = el.querySelector<HTMLInputElement>('input[name="email"]')!;
    const name = el.querySelector<HTMLInputElement>('input[name="name"]')!;
    const password = el.querySelector<HTMLInputElement>('input[name="password"]')!;
    email.value = 'a@b.co';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    name.value = 'Alex';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    password.value = 'hunter22';
    password.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigateByUrl').and.callThrough();
    const form = el.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 500));
    await fixture.whenStable();
    expect(nav).toHaveBeenCalledWith('/onboarding');
  });

  it('produces no axe violations in login mode', async () => {
    const fixture = mount();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('produces no axe violations in signup mode (pt-BR)', async () => {
    TestBed.inject(I18nService).setLocale('pt-BR');
    const fixture = mount();
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    fixture.detectChanges();
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
