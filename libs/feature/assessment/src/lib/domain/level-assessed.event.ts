import type { SupportedLocale } from '@shared/i18n';

import type { CefrLevel } from './cefr';
import type { AssessmentSkill, AssessmentSubScore } from './assessment.types';

/**
 * Contract shared with the .NET Application layer's `LevelAssessed` domain
 * event. Every field here is also consumed by F2 (adaptive methodology) —
 * adding or renaming fields without bumping the schema version is a breaking
 * change.
 *
 * The .NET side lives in a sibling repository; `tools/check-schema.mjs` (added
 * by this ticket) validates the contract test output against this shape.
 */
export const LEVEL_ASSESSED_SCHEMA_VERSION = 1;

export interface LevelAssessedEvent {
  readonly schemaVersion: typeof LEVEL_ASSESSED_SCHEMA_VERSION;
  readonly type: 'LevelAssessed';
  readonly assessmentId: string;
  readonly studentId: string;
  readonly level: CefrLevel;
  readonly score: number;
  readonly confidence: number;
  readonly skills: Readonly<Record<AssessmentSkill, { readonly level: CefrLevel; readonly score: number }>>;
  readonly subScores: Readonly<Record<AssessmentSubScore, number>>;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly locale: SupportedLocale;
}

export function isLevelAssessedEvent(value: unknown): value is LevelAssessedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<LevelAssessedEvent>;
  return (
    v.type === 'LevelAssessed' &&
    v.schemaVersion === LEVEL_ASSESSED_SCHEMA_VERSION &&
    typeof v.assessmentId === 'string' &&
    typeof v.studentId === 'string' &&
    typeof v.level === 'string' &&
    typeof v.score === 'number' &&
    typeof v.confidence === 'number' &&
    !!v.skills &&
    !!v.subScores &&
    typeof v.startedAt === 'string' &&
    typeof v.completedAt === 'string' &&
    (v.locale === 'en' || v.locale === 'pt-BR')
  );
}
