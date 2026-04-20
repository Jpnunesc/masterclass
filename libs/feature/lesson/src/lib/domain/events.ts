import type { AssessmentSkill, CefrLevel } from '@feature/assessment';
import type { SupportedLocale } from '@shared/i18n';

import type { ActivityKind } from './lesson.types';

/**
 * Versioned contract shared with the .NET Application layer and F4 (progress
 * tracking). Every field is consumed downstream — renaming or dropping a
 * field without a schema bump is a breaking change. The contract test in
 * `lesson.events.spec.ts` exercises this shape end-to-end.
 */
export const SKILL_PRACTICED_SCHEMA_VERSION = 1;
export const LESSON_COMPLETED_SCHEMA_VERSION = 1;

export interface SkillPracticedEvent {
  readonly schemaVersion: typeof SKILL_PRACTICED_SCHEMA_VERSION;
  readonly type: 'SkillPracticed';
  readonly lessonId: string;
  readonly studentId: string;
  readonly activityId: string;
  readonly activityKind: ActivityKind;
  readonly skill: AssessmentSkill;
  readonly cefrLevel: CefrLevel;
  readonly quality: number;
  readonly durationMs: number;
  readonly observedAt: string;
  readonly locale: SupportedLocale;
}

export interface LessonCompletedEvent {
  readonly schemaVersion: typeof LESSON_COMPLETED_SCHEMA_VERSION;
  readonly type: 'LessonCompleted';
  readonly lessonId: string;
  readonly studentId: string;
  readonly assessmentId: string;
  readonly cefrLevel: CefrLevel;
  readonly activityIds: readonly string[];
  readonly skillsPracticed: readonly AssessmentSkill[];
  readonly averageQuality: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly locale: SupportedLocale;
}

export function isSkillPracticedEvent(value: unknown): value is SkillPracticedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<SkillPracticedEvent>;
  return (
    v.type === 'SkillPracticed' &&
    v.schemaVersion === SKILL_PRACTICED_SCHEMA_VERSION &&
    typeof v.lessonId === 'string' &&
    typeof v.studentId === 'string' &&
    typeof v.activityId === 'string' &&
    typeof v.activityKind === 'string' &&
    typeof v.skill === 'string' &&
    typeof v.cefrLevel === 'string' &&
    typeof v.quality === 'number' &&
    typeof v.durationMs === 'number' &&
    typeof v.observedAt === 'string' &&
    (v.locale === 'en' || v.locale === 'pt-BR')
  );
}

export function isLessonCompletedEvent(value: unknown): value is LessonCompletedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<LessonCompletedEvent>;
  return (
    v.type === 'LessonCompleted' &&
    v.schemaVersion === LESSON_COMPLETED_SCHEMA_VERSION &&
    typeof v.lessonId === 'string' &&
    typeof v.studentId === 'string' &&
    typeof v.assessmentId === 'string' &&
    typeof v.cefrLevel === 'string' &&
    Array.isArray(v.activityIds) &&
    Array.isArray(v.skillsPracticed) &&
    typeof v.averageQuality === 'number' &&
    typeof v.startedAt === 'string' &&
    typeof v.completedAt === 'string' &&
    (v.locale === 'en' || v.locale === 'pt-BR')
  );
}
