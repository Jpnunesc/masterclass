import {
  CEFR_LEVELS,
  CEFR_ORDINALS,
  levelFromScore,
  type AssessmentSkill,
  type CefrLevel,
  type LevelAssessedEvent
} from '@feature/assessment';
import type { MaterialViewedEvent } from '@feature/materials';
import type { SupportedLocale } from '@shared/i18n';

import type { LessonCompletedEvent } from '../domain/lesson-completed.event';
import type { SkillPracticedEvent } from '../domain/skill-practiced.event';
import {
  EMPTY_SKILLS,
  emptySnapshot,
  type Milestone,
  type SkillBreakdown,
  type SkillKey,
  type StudentProgressSnapshot,
  type TimelineEvent
} from '../domain/progress.types';
import { computeStreaks } from './streak';

/**
 * Exponential moving average weight used when folding lesson/skill scores
 * into the running profile. 0.35 tracks new data quickly enough for the
 * dashboard to feel responsive without whip-sawing on a single bad answer.
 */
const EMA_ALPHA = 0.35;

/**
 * Pure projection layer. The service keeps a sorted list of activity
 * timestamps and applies each event in order, producing an immutable
 * StudentProgressSnapshot — so the UI can render from a single signal and
 * tests can assert projection correctness without DI.
 */
export interface ProjectionState {
  readonly snapshot: StudentProgressSnapshot;
  readonly timeline: readonly TimelineEvent[];
  readonly milestones: readonly Milestone[];
  readonly activityTimestamps: readonly string[];
}

export function initialProjection(
  studentId: string,
  now: string
): ProjectionState {
  return {
    snapshot: emptySnapshot(studentId, now),
    timeline: [],
    milestones: [],
    activityTimestamps: []
  };
}

export function applyLevelAssessed(
  state: ProjectionState,
  event: LevelAssessedEvent
): ProjectionState {
  const skills: Record<SkillKey, SkillBreakdown> = { ...EMPTY_SKILLS };
  const prevSkills = state.snapshot.skills;
  for (const key of Object.keys(skills) as SkillKey[]) {
    const assessed = event.skills[key as AssessmentSkill];
    skills[key] = {
      level: assessed.level,
      score: assessed.score,
      samples: prevSkills[key].samples + 1
    };
  }

  const snapshot: StudentProgressSnapshot = {
    ...state.snapshot,
    level: event.level,
    overallScore: event.score,
    confidence: event.confidence,
    skills,
    subScores: {
      grammar: event.subScores.grammar,
      vocabulary: event.subScores.vocabulary
    },
    lastActivityAt: event.completedAt,
    updatedAt: event.completedAt
  };

  const timeline = appendTimeline(state.timeline, {
    id: `assessed-${event.assessmentId}`,
    studentId: event.studentId,
    occurredAt: event.completedAt,
    locale: event.locale,
    kind: 'level_assessed',
    summary: `assessment.result.announced:${event.level}`,
    level: event.level,
    scoreDelta: event.score - state.snapshot.overallScore
  });

  const milestones = maybeAddMilestone(
    state.milestones,
    state.snapshot.level,
    event.level,
    event.completedAt,
    event.locale
  );

  const activityTimestamps = [...state.activityTimestamps, event.completedAt];
  return {
    snapshot: withStreak(snapshot, activityTimestamps),
    timeline,
    milestones,
    activityTimestamps
  };
}

export function applyLessonCompleted(
  state: ProjectionState,
  event: LessonCompletedEvent
): ProjectionState {
  const prevOverall = state.snapshot.overallScore;
  const overallScore = ema(prevOverall, event.score);
  const level = resolveLevel(overallScore, event.level, state.snapshot.level);

  const snapshot: StudentProgressSnapshot = {
    ...state.snapshot,
    level,
    overallScore,
    confidence: Math.min(1, state.snapshot.confidence + 0.05),
    lessonsCompleted: state.snapshot.lessonsCompleted + 1,
    lastActivityAt: event.completedAt,
    updatedAt: event.completedAt
  };

  const timeline = appendTimeline(state.timeline, {
    id: `lesson-${event.lessonId}`,
    studentId: event.studentId,
    occurredAt: event.completedAt,
    locale: event.locale,
    kind: 'lesson_completed',
    summary: `progress.timeline.lesson:${event.level}:${event.topic}`,
    level: event.level,
    scoreDelta: overallScore - prevOverall
  });

  const milestones = maybeAddMilestone(
    state.milestones,
    state.snapshot.level,
    level,
    event.completedAt,
    event.locale
  );

  const activityTimestamps = [...state.activityTimestamps, event.completedAt];
  return {
    snapshot: withStreak(snapshot, activityTimestamps),
    timeline,
    milestones,
    activityTimestamps
  };
}

export function applyMaterialViewed(
  state: ProjectionState,
  event: MaterialViewedEvent
): ProjectionState {
  const snapshot: StudentProgressSnapshot = {
    ...state.snapshot,
    materialsViewed: state.snapshot.materialsViewed + 1,
    lastActivityAt: event.viewedAt,
    updatedAt: event.viewedAt
  };

  const timeline = appendTimeline(state.timeline, {
    id: `material-${event.materialId}-${event.viewedAt}`,
    studentId: event.studentId,
    occurredAt: event.viewedAt,
    locale: inferLocale(state),
    kind: 'material_viewed',
    summary: `progress.timeline.material:${event.kind}`
  });

  const activityTimestamps = [...state.activityTimestamps, event.viewedAt];
  return {
    snapshot: withStreak(snapshot, activityTimestamps),
    timeline,
    milestones: state.milestones,
    activityTimestamps
  };
}

export function applySkillPracticed(
  state: ProjectionState,
  event: SkillPracticedEvent
): ProjectionState {
  const prev = state.snapshot.skills[event.skill];
  const nextScore = ema(prev.score, event.score);
  const nextLevel = levelFromScore(nextScore);
  const skills: Record<SkillKey, SkillBreakdown> = {
    ...state.snapshot.skills,
    [event.skill]: {
      level: higherLevel(prev.level, nextLevel),
      score: nextScore,
      samples: prev.samples + 1
    }
  };

  const overallScore = averageScore(skills);
  const level = resolveLevel(overallScore, event.level, state.snapshot.level);

  const snapshot: StudentProgressSnapshot = {
    ...state.snapshot,
    level,
    overallScore,
    skills,
    lastActivityAt: event.practicedAt,
    updatedAt: event.practicedAt
  };

  const timeline = appendTimeline(state.timeline, {
    id: `skill-${event.skill}-${event.practicedAt}`,
    studentId: event.studentId,
    occurredAt: event.practicedAt,
    locale: event.locale,
    kind: 'skill_practiced',
    summary: `progress.timeline.skill:${event.skill}`,
    skill: event.skill,
    level: nextLevel,
    scoreDelta: nextScore - prev.score
  });

  const milestones = maybeAddMilestone(
    state.milestones,
    state.snapshot.level,
    level,
    event.practicedAt,
    event.locale
  );

  const activityTimestamps = [...state.activityTimestamps, event.practicedAt];
  return {
    snapshot: withStreak(snapshot, activityTimestamps),
    timeline,
    milestones,
    activityTimestamps
  };
}

function withStreak(
  snapshot: StudentProgressSnapshot,
  activityTimestamps: readonly string[]
): StudentProgressSnapshot {
  const stats = computeStreaks(activityTimestamps);
  return {
    ...snapshot,
    streakDays: stats.current,
    longestStreakDays: Math.max(stats.longest, snapshot.longestStreakDays)
  };
}

function appendTimeline(
  timeline: readonly TimelineEvent[],
  entry: TimelineEvent
): readonly TimelineEvent[] {
  // Keep descending by time so the virtualized list renders newest-first
  // without an additional sort pass on every render.
  const next = [entry, ...timeline];
  next.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  return next;
}

function maybeAddMilestone(
  milestones: readonly Milestone[],
  previous: CefrLevel,
  current: CefrLevel,
  at: string,
  locale: SupportedLocale
): readonly Milestone[] {
  if (CEFR_ORDINALS[current] <= CEFR_ORDINALS[previous]) return milestones;
  const id = `milestone-${current}-${at}`;
  if (milestones.some((m) => m.id === id)) return milestones;
  const label =
    locale === 'pt-BR'
      ? `Subiu para ${current}`
      : `Reached ${current}`;
  const detail =
    locale === 'pt-BR'
      ? `Novo nível CEFR atingido em ${formatDay(at, locale)}.`
      : `New CEFR level achieved on ${formatDay(at, locale)}.`;
  return [...milestones, { id, label, detail, reachedAt: at }];
}

function formatDay(iso: string, locale: SupportedLocale): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  const d = new Date(parsed);
  const tag = locale === 'pt-BR' ? 'pt-BR' : 'en-US';
  return d.toLocaleDateString(tag, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

function ema(previous: number, next: number): number {
  if (Number.isNaN(previous) || previous === 0) return clamp01(next);
  return clamp01(previous * (1 - EMA_ALPHA) + next * EMA_ALPHA);
}

function averageScore(
  skills: Readonly<Record<SkillKey, SkillBreakdown>>
): number {
  const values = (Object.keys(skills) as SkillKey[]).map((k) => skills[k].score);
  const sum = values.reduce((a, b) => a + b, 0);
  return clamp01(sum / values.length);
}

function resolveLevel(
  overallScore: number,
  hintedLevel: CefrLevel,
  previousLevel: CefrLevel
): CefrLevel {
  const derived = levelFromScore(overallScore);
  const highest = [derived, hintedLevel, previousLevel].reduce((a, b) =>
    CEFR_ORDINALS[a] >= CEFR_ORDINALS[b] ? a : b
  );
  return highest;
}

function higherLevel(a: CefrLevel, b: CefrLevel): CefrLevel {
  return CEFR_ORDINALS[a] >= CEFR_ORDINALS[b] ? a : b;
}

function inferLocale(state: ProjectionState): SupportedLocale {
  const newest = state.timeline[0];
  return newest?.locale ?? 'en';
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// Surfaces the CEFR tier table so dashboards can show progress bars.
export const CEFR_MAX_INDEX = CEFR_LEVELS.length - 1;

export function normalizedLevel(level: CefrLevel): number {
  return CEFR_ORDINALS[level] / CEFR_MAX_INDEX;
}

// Narrow re-export so downstream code can reach the skill union without
// introducing an additional assessment import.
export type { AssessmentSkill };
