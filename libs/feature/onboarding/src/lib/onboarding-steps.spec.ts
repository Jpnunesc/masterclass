import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { I18nService } from '@shared/i18n';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

import { OnboardingStateService } from './onboarding-state.service';
import { StepLanguageComponent } from './step-language.component';
import { StepTeacherComponent } from './step-teacher.component';
import { StepAssessmentComponent } from './step-assessment.component';

function mount<T>(cmp: new (...args: unknown[]) => T) {
  const fixture = TestBed.createComponent(cmp);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  return fixture;
}

describe('Onboarding steps', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [StepLanguageComponent, StepTeacherComponent, StepAssessmentComponent],
      providers: [
        provideRouter([
          { path: 'onboarding/language', children: [] },
          { path: 'onboarding/teacher', children: [] },
          { path: 'onboarding/assessment', children: [] },
          { path: 'assessment', children: [] }
        ]),
        OnboardingStateService
      ]
    }).compileComponents();
    TestBed.inject(I18nService).setLocale('en');
  });

  afterEach(() => {
    document.querySelectorAll('mc-step-language, mc-step-teacher, mc-step-assessment').forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('step 1 pre-selects the active locale and routes to teacher on continue', async () => {
    const fixture = mount(StepLanguageComponent);
    const el = fixture.nativeElement as HTMLElement;
    const active = el.querySelector('[role="radio"][aria-checked="true"]');
    expect(active?.textContent?.trim()).toBe('English');
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigateByUrl').and.callThrough();
    el.querySelector<HTMLButtonElement>('.mc-step__cta')!.click();
    await new Promise((r) => setTimeout(r, 120));
    expect(nav).toHaveBeenCalledWith('/onboarding/teacher');
    expect(TestBed.inject(OnboardingStateService).language()).toBe('en');
  });

  it('step 1 pill keyboard navigation updates selection', () => {
    const fixture = mount(StepLanguageComponent);
    const el = fixture.nativeElement as HTMLElement;
    const group = el.querySelector<HTMLElement>('[role="radiogroup"]')!;
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    const active = el.querySelector('[role="radio"][aria-checked="true"]');
    expect(active?.textContent?.trim()).toBe('Português (Brasil)');
  });

  it('step 2 disables continue until a teacher is picked', () => {
    const fixture = mount(StepTeacherComponent);
    const el = fixture.nativeElement as HTMLElement;
    const cta = el.querySelector<HTMLButtonElement>('.mc-step__cta')!;
    expect(cta.disabled).toBe(true);
    const cards = el.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    cards[0].click();
    fixture.detectChanges();
    expect(cta.disabled).toBe(false);
    expect(cta.textContent).toContain('Ana');
  });

  it('step 3 switches tone preview on selection', () => {
    const fixture = mount(StepAssessmentComponent);
    const el = fixture.nativeElement as HTMLElement;
    const tabs = el.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(el.textContent).toContain(`You're doing fine`);
    tabs[1].click();
    fixture.detectChanges();
    expect(el.textContent).toContain(`Small fix`);
    expect(TestBed.inject(OnboardingStateService).tone()).toBe('direct');
  });

  it('step 1 has no axe violations', async () => {
    const fixture = mount(StepLanguageComponent);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('step 2 has no axe violations', async () => {
    const fixture = mount(StepTeacherComponent);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });

  it('step 3 has no axe violations', async () => {
    const fixture = mount(StepAssessmentComponent);
    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
