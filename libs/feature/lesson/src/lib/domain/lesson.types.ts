import type { AssessmentSkill } from '@feature/assessment';
import type { CefrLevel } from '@feature/assessment';
import type { I18nKey, SupportedLocale } from '@shared/i18n';

export type ActivityKind =
  | 'warmup'
  | 'vocabulary'
  | 'grammar'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'correction'
  | 'review'
  | 'cooldown';

export interface LessonActivity {
  readonly id: string;
  readonly kind: ActivityKind;
  readonly targetSkill: AssessmentSkill;
  readonly cefrLevel: CefrLevel;
  readonly promptKey: I18nKey;
  readonly objectiveKey: I18nKey;
  readonly estSeconds: number;
  /**
   * Difficulty step relative to the student's current level: -1 scaffolds down,
   * 0 keeps at level, +1 stretches up. The live adjuster mutates this between
   * activities, never during one.
   */
  readonly difficultyOffset: -1 | 0 | 1;
  /**
   * Optional vocabulary or grammar tag drawn from the per-level curriculum
   * seed. Used by the planner to avoid repeating the same target twice in a
   * single plan.
   */
  readonly topic?: string;
}

export interface FourSkillsBalance {
  readonly listen: number;
  readonly speak: number;
  readonly read: number;
  readonly write: number;
}

export interface LessonPlan {
  readonly id: string;
  readonly studentId: string;
  readonly assessmentId: string;
  readonly targetLevel: CefrLevel;
  readonly locale: SupportedLocale;
  readonly activities: readonly LessonActivity[];
  readonly balance: FourSkillsBalance;
  readonly estMinutes: number;
  readonly generatedAt: string;
  /**
   * Signature derived from the ordered activity ids. Two plans with the same
   * signature are behaviourally identical — the planner uses this to assert
   * per-profile uniqueness in tests and telemetry.
   */
  readonly signature: string;
}

export type LessonPhase =
  | 'idle'
  | 'planning'
  | 'active'
  | 'completed'
  | 'error';

export interface LessonSnapshot {
  readonly phase: LessonPhase;
  readonly plan: LessonPlan | null;
  readonly activityIndex: number;
  readonly currentActivity: LessonActivity | null;
  readonly completedActivityIds: readonly string[];
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly error: string | null;
}

export const INITIAL_LESSON_SNAPSHOT: LessonSnapshot = {
  phase: 'idle',
  plan: null,
  activityIndex: 0,
  currentActivity: null,
  completedActivityIds: [],
  startedAt: null,
  completedAt: null,
  error: null
};
