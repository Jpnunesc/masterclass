import type { CefrLevel } from '@feature/assessment';
import type { MaterialKind, MaterialTopic } from '@feature/materials';
import type { SupportedLocale } from '@shared/i18n';

/**
 * Contract consumed from F2 (methodology). Every field here is part of the
 * public event surface — adding or renaming fields without bumping the schema
 * version is a breaking change.
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

export function isLessonCompletedEvent(
  value: unknown
): value is LessonCompletedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<LessonCompletedEvent>;
  return (
    v.type === 'LessonCompleted' &&
    v.schemaVersion === LESSON_COMPLETED_SCHEMA_VERSION &&
    typeof v.lessonId === 'string' &&
    typeof v.studentId === 'string' &&
    typeof v.level === 'string' &&
    typeof v.topic === 'string' &&
    typeof v.kind === 'string' &&
    (v.locale === 'en' || v.locale === 'pt-BR') &&
    typeof v.completedAt === 'string' &&
    typeof v.durationSeconds === 'number' &&
    typeof v.score === 'number'
  );
}
