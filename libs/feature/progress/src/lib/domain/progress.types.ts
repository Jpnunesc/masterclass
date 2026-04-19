import type {
  AssessmentSkill,
  AssessmentSubScore,
  CefrLevel
} from '@feature/assessment';
import type { MaterialKind, MaterialTopic } from '@feature/materials';
import type { SupportedLocale } from '@shared/i18n';

/**
 * Per-skill breakdown on the progress dashboard. `samples` counts the number
 * of practice events that contributed to the running score so the UI can show
 * "n data points" and tests can assert projection correctness.
 */
export interface SkillBreakdown {
  readonly level: CefrLevel;
  readonly score: number;
  readonly samples: number;
}

export type SkillKey = AssessmentSkill;

export type SubScoreKey = AssessmentSubScore;

/**
 * Goal suggested by the AI tutor. `origin` distinguishes heuristic goals
 * (generated locally when the AI adapter is offline) from model-generated
 * ones so the UI can badge them accordingly.
 */
export interface Goal {
  readonly id: string;
  readonly titleKey?: string;
  readonly title: string;
  readonly detail: string;
  readonly targetSkill: SkillKey | 'overall';
  readonly targetLevel: CefrLevel;
  readonly targetScore: number;
  readonly createdAt: string;
  readonly dueAt: string | null;
  readonly origin: 'heuristic' | 'azure_openai';
  readonly completedAt: string | null;
}

export interface Milestone {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly reachedAt: string;
}

export type TimelineEventKind =
  | 'level_assessed'
  | 'lesson_completed'
  | 'material_viewed'
  | 'skill_practiced'
  | 'milestone_reached';

export interface TimelineEventBase {
  readonly id: string;
  readonly studentId: string;
  readonly occurredAt: string;
  readonly locale: SupportedLocale;
  readonly kind: TimelineEventKind;
  readonly summary: string;
  readonly skill?: SkillKey;
  readonly level?: CefrLevel;
  readonly scoreDelta?: number;
}

export type TimelineEvent = TimelineEventBase;

/**
 * Snapshot of a student's progress at a point in time. This is the read-model
 * the dashboard renders from and the payload emitted as `ProgressUpdated` for
 * F6 — any field added here becomes part of that public contract.
 */
export interface StudentProgressSnapshot {
  readonly studentId: string;
  readonly level: CefrLevel;
  readonly overallScore: number;
  readonly confidence: number;
  readonly skills: Readonly<Record<SkillKey, SkillBreakdown>>;
  readonly subScores: Readonly<Record<SubScoreKey, number>>;
  readonly lessonsCompleted: number;
  readonly materialsViewed: number;
  readonly streakDays: number;
  readonly longestStreakDays: number;
  readonly lastActivityAt: string | null;
  readonly updatedAt: string;
}

export interface ProgressState {
  readonly phase: 'idle' | 'ready' | 'loading' | 'error';
  readonly snapshot: StudentProgressSnapshot | null;
  readonly timeline: readonly TimelineEvent[];
  readonly milestones: readonly Milestone[];
  readonly goals: readonly Goal[];
  readonly error: string | null;
}

export const EMPTY_SKILLS: Readonly<Record<SkillKey, SkillBreakdown>> = {
  listen: { level: 'A1', score: 0, samples: 0 },
  speak: { level: 'A1', score: 0, samples: 0 },
  read: { level: 'A1', score: 0, samples: 0 },
  write: { level: 'A1', score: 0, samples: 0 }
};

export const EMPTY_SUBSCORES: Readonly<Record<SubScoreKey, number>> = {
  grammar: 0,
  vocabulary: 0
};

export const INITIAL_PROGRESS_STATE: ProgressState = {
  phase: 'idle',
  snapshot: null,
  timeline: [],
  milestones: [],
  goals: [],
  error: null
};

export function emptySnapshot(
  studentId: string,
  now: string
): StudentProgressSnapshot {
  return {
    studentId,
    level: 'A1',
    overallScore: 0,
    confidence: 0,
    skills: EMPTY_SKILLS,
    subScores: EMPTY_SUBSCORES,
    lessonsCompleted: 0,
    materialsViewed: 0,
    streakDays: 0,
    longestStreakDays: 0,
    lastActivityAt: null,
    updatedAt: now
  };
}

export interface LessonCompletedInput {
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

export interface SkillPracticedInput {
  readonly studentId: string;
  readonly skill: SkillKey;
  readonly level: CefrLevel;
  readonly score: number;
  readonly practicedAt: string;
  readonly locale: SupportedLocale;
}
