import type { AssessmentSkill, CefrLevel } from '@feature/assessment';
import type { MaterialId, MaterialTopic } from '@feature/materials';
import type { SupportedLocale } from '@shared/i18n';

export type ReviewSkill = 'vocabulary' | 'grammar' | 'listening' | 'reading';

export const REVIEW_SKILLS: readonly ReviewSkill[] = [
  'vocabulary',
  'grammar',
  'listening',
  'reading'
] as const;

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export const REVIEW_GRADE_VALUE: Record<ReviewGrade, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5
};

export type ReviewItemId = string;

export interface ReviewItem {
  readonly id: ReviewItemId;
  readonly studentId: string;
  readonly skill: ReviewSkill;
  readonly topic: MaterialTopic;
  readonly level: CefrLevel;
  readonly prompt: string;
  readonly answer: string;
  readonly sourceMaterialId: MaterialId | null;
  readonly locale: SupportedLocale;
}

export interface ReviewScheduleEntry {
  readonly itemId: ReviewItemId;
  readonly repetitions: number;
  readonly easeFactor: number;
  readonly intervalDays: number;
  readonly dueAt: string;
  readonly lastGrade: ReviewGrade | null;
  readonly lastReviewedAt: string | null;
  readonly suspendedUntil: string | null;
  readonly markedKnownAt: string | null;
}

export interface ReviewScheduleState {
  readonly studentId: string;
  readonly items: ReadonlyMap<ReviewItemId, ReviewItem>;
  readonly entries: ReadonlyMap<ReviewItemId, ReviewScheduleEntry>;
  readonly weakSkills: readonly AssessmentSkill[];
  readonly updatedAt: string;
}

export interface ReviewQueueEntry {
  readonly item: ReviewItem;
  readonly entry: ReviewScheduleEntry;
}

export type ReviewSessionPhase =
  | 'idle'
  | 'running'
  | 'completed';

export interface ReviewSessionOutcome {
  readonly itemId: ReviewItemId;
  readonly grade: ReviewGrade;
  readonly skill: ReviewSkill;
  readonly topic: MaterialTopic;
  readonly completedAt: string;
}

export interface ReviewSessionState {
  readonly phase: ReviewSessionPhase;
  readonly queue: readonly ReviewQueueEntry[];
  readonly currentIndex: number;
  readonly outcomes: readonly ReviewSessionOutcome[];
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

export interface ReviewState {
  readonly schedule: ReviewScheduleState;
  readonly session: ReviewSessionState;
}

export const EMPTY_REVIEW_SCHEDULE: ReviewScheduleState = {
  studentId: 'anonymous',
  items: new Map(),
  entries: new Map(),
  weakSkills: [],
  updatedAt: new Date(0).toISOString()
};

export const EMPTY_REVIEW_SESSION: ReviewSessionState = {
  phase: 'idle',
  queue: [],
  currentIndex: 0,
  outcomes: [],
  startedAt: null,
  completedAt: null
};

export const INITIAL_REVIEW_STATE: ReviewState = {
  schedule: EMPTY_REVIEW_SCHEDULE,
  session: EMPTY_REVIEW_SESSION
};
