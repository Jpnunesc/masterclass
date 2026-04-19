import { Injectable, computed, signal } from '@angular/core';
import type { SupportedLocale } from '@shared/i18n';

export type Teacher = 'ana' | 'daniel';
export type Tone = 'warm' | 'direct' | 'relaxed';
export type StepKey = 'language' | 'teacher' | 'assessment';

export interface OnboardingSnapshot {
  readonly language: SupportedLocale | null;
  readonly teacher: Teacher | null;
  readonly tone: Tone;
}

const STEP_ORDER: readonly StepKey[] = ['language', 'teacher', 'assessment'];

@Injectable({ providedIn: 'root' })
export class OnboardingStateService {
  private readonly _language = signal<SupportedLocale | null>(null);
  private readonly _teacher = signal<Teacher | null>(null);
  private readonly _tone = signal<Tone>('warm');

  readonly language = this._language.asReadonly();
  readonly teacher = this._teacher.asReadonly();
  readonly tone = this._tone.asReadonly();

  readonly snapshot = computed<OnboardingSnapshot>(() => ({
    language: this._language(),
    teacher: this._teacher(),
    tone: this._tone()
  }));

  setLanguage(locale: SupportedLocale): void {
    this._language.set(locale);
  }

  setTeacher(teacher: Teacher): void {
    this._teacher.set(teacher);
  }

  setTone(tone: Tone): void {
    this._tone.set(tone);
  }

  completed(step: StepKey): boolean {
    if (step === 'language') return this._language() !== null;
    if (step === 'teacher') return this._teacher() !== null;
    return false;
  }
}

export function stepIndex(step: StepKey): number {
  return STEP_ORDER.indexOf(step);
}

export { STEP_ORDER };
