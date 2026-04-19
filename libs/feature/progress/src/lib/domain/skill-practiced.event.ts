import type { AssessmentSkill, CefrLevel } from '@feature/assessment';
import type { SupportedLocale } from '@shared/i18n';

/**
 * Contract consumed from F2 methodology whenever the tutor rates a single
 * skill attempt. The projection aggregates these into running skill profiles.
 */
export const SKILL_PRACTICED_SCHEMA_VERSION = 1;

export interface SkillPracticedEvent {
  readonly schemaVersion: typeof SKILL_PRACTICED_SCHEMA_VERSION;
  readonly type: 'SkillPracticed';
  readonly studentId: string;
  readonly skill: AssessmentSkill;
  readonly level: CefrLevel;
  readonly score: number;
  readonly practicedAt: string;
  readonly locale: SupportedLocale;
}

export function isSkillPracticedEvent(
  value: unknown
): value is SkillPracticedEvent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<SkillPracticedEvent>;
  return (
    v.type === 'SkillPracticed' &&
    v.schemaVersion === SKILL_PRACTICED_SCHEMA_VERSION &&
    typeof v.studentId === 'string' &&
    typeof v.skill === 'string' &&
    typeof v.level === 'string' &&
    typeof v.score === 'number' &&
    typeof v.practicedAt === 'string' &&
    (v.locale === 'en' || v.locale === 'pt')
  );
}
