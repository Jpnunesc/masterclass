import type { I18nKey } from '@shared/i18n';

export type Teacher = 'ana' | 'daniel';
export type AssessmentTone = 'warm' | 'direct' | 'relaxed';

export interface TeacherOption {
  readonly id: Teacher;
  readonly nameKey: I18nKey;
  readonly introKey: I18nKey;
  readonly portraitAltKey: I18nKey;
}

export const TEACHERS: readonly TeacherOption[] = [
  {
    id: 'ana',
    nameKey: 'onboarding.step2.teacher.ana.name',
    introKey: 'onboarding.step2.teacher.ana.intro',
    portraitAltKey: 'onboarding.step2.teacher.ana.portrait_alt'
  },
  {
    id: 'daniel',
    nameKey: 'onboarding.step2.teacher.daniel.name',
    introKey: 'onboarding.step2.teacher.daniel.intro',
    portraitAltKey: 'onboarding.step2.teacher.daniel.portrait_alt'
  }
] as const;

export const ASSESSMENT_TONES: readonly AssessmentTone[] = [
  'warm',
  'direct',
  'relaxed'
] as const;

export const TONE_LABEL_KEYS: Readonly<Record<AssessmentTone, I18nKey>> = {
  warm: 'common.tone.warm',
  direct: 'common.tone.direct',
  relaxed: 'common.tone.relaxed'
};

export const TONE_STORAGE_KEY = 'mc.assessmentTone';
export const TEACHER_STORAGE_KEY = 'mc.teacher';
