import type { CefrLevel } from '@feature/assessment';
import type { MaterialKind, MaterialTopic } from '@feature/materials';
import type { SupportedLocale } from '@shared/i18n';

/**
 * Public contract emitted by F5 (lesson-history) and consumed by F4 (progress)
 * and F6 (spaced-repetition). Matches the ingest shape progress already accepts
 * so the two features line up wire-for-wire without an adapter.
 */
export const LESSON_COMPLETED_SCHEMA_VERSION = 1;

export interface LessonCompletedEvent {
  readonly schemaVersion: typeof LESSON_COMPLETED_SCHEMA_VERSION;
  readonly type: 'LessonCompleted';
  readonly lessonId: string;
  readonly studentId: string;
  readonly level: CefrLevel;
  readonly topic: MaterialTopic;
  readonly kind: MaterialKind;
  readonly locale: SupportedLocale;
  readonly completedAt: string;
  readonly durationSeconds: number;
  readonly score: number;
}
