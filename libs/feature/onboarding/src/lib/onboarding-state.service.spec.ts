import { TestBed } from '@angular/core/testing';
import { OnboardingStateService, STEP_ORDER, stepIndex } from './onboarding-state.service';

describe('OnboardingStateService', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [OnboardingStateService] }));

  it('defaults to warm tone and null teacher/language', () => {
    const svc = TestBed.inject(OnboardingStateService);
    expect(svc.language()).toBeNull();
    expect(svc.teacher()).toBeNull();
    expect(svc.tone()).toBe('warm');
  });

  it('tracks step completion based on inputs', () => {
    const svc = TestBed.inject(OnboardingStateService);
    expect(svc.completed('language')).toBe(false);
    svc.setLanguage('pt-BR');
    expect(svc.completed('language')).toBe(true);
    expect(svc.completed('teacher')).toBe(false);
    svc.setTeacher('ana');
    expect(svc.completed('teacher')).toBe(true);
  });

  it('stepIndex mirrors STEP_ORDER', () => {
    expect(STEP_ORDER).toEqual(['language', 'teacher', 'assessment']);
    expect(stepIndex('language')).toBe(0);
    expect(stepIndex('assessment')).toBe(2);
  });
});
