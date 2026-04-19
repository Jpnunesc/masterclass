import type { CefrLevel } from '@feature/assessment';

import type { SkillBreakdown, SkillKey, SubScoreKey } from './progress.types';

/**
 * Contract emitted by F4 (Progress) and consumed by F6 (Spaced Repetition).
 * Every field is part of the public surface — adding or renaming fields
 * without bumping the schema version is a breaking change.
 */
export const PROGRESS_UPDATED_SCHEMA_VERSION = 1;

export interface ProgressUpdatedEvent {
  readonly schemaVersion: typeof PROGRESS_UPDATED_SCHEMA_VERSION;
  readonly type: 'ProgressUpdated';
  readonly studentId: string;
  readonly level: CefrLevel;
  readonly overallScore: number;
  readonly confidence: number;
  readonly skills: Readonly<Record<SkillKey, SkillBreakdown>>;
  readonly subScores: Readonly<Record<SubScoreKey, number>>;
  readonly lessonsCompleted: number;
  readonly streakDays: number;
  readonly updatedAt: string;
}

export function isProgressUpdatedEvent(
  value: unknown
): value is ProgressUpdatedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ProgressUpdatedEvent>;
  return (
    v.type === 'ProgressUpdated' &&
    v.schemaVersion === PROGRESS_UPDATED_SCHEMA_VERSION &&
    typeof v.studentId === 'string' &&
    typeof v.level === 'string' &&
    typeof v.overallScore === 'number' &&
    typeof v.confidence === 'number' &&
    !!v.skills &&
    !!v.subScores &&
    typeof v.lessonsCompleted === 'number' &&
    typeof v.streakDays === 'number' &&
    typeof v.updatedAt === 'string'
  );
}
