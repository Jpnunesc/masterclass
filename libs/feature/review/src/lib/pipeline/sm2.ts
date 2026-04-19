import type {
  ReviewGrade,
  ReviewScheduleEntry
} from '../domain/review.types';
import { REVIEW_GRADE_VALUE } from '../domain/review.types';

export const SM2_DEFAULT_EASE_FACTOR = 2.5;
export const SM2_MIN_EASE_FACTOR = 1.3;

export function freshEntry(
  itemId: string,
  now: string
): ReviewScheduleEntry {
  return {
    itemId,
    repetitions: 0,
    easeFactor: SM2_DEFAULT_EASE_FACTOR,
    intervalDays: 0,
    dueAt: now,
    lastGrade: null,
    lastReviewedAt: null,
    suspendedUntil: null,
    markedKnownAt: null
  };
}

/**
 * Apply one SM-2 review step. Pure: given the same entry + grade + now it
 * always returns the same next state. Floating-point is kept simple (rounds
 * intervalDays) so replays in tests are bit-stable.
 */
export function applyGrade(
  entry: ReviewScheduleEntry,
  grade: ReviewGrade,
  now: string
): ReviewScheduleEntry {
  const q = REVIEW_GRADE_VALUE[grade];

  let repetitions: number;
  let intervalDays: number;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = entry.repetitions + 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(entry.intervalDays * entry.easeFactor);
  }

  const rawEf =
    entry.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const easeFactor = Math.max(SM2_MIN_EASE_FACTOR, round4(rawEf));

  const dueAt = addDaysIso(now, intervalDays);

  return {
    ...entry,
    repetitions,
    easeFactor,
    intervalDays,
    dueAt,
    lastGrade: grade,
    lastReviewedAt: now,
    suspendedUntil: null
  };
}

export function snoozeEntry(
  entry: ReviewScheduleEntry,
  untilIso: string
): ReviewScheduleEntry {
  return { ...entry, suspendedUntil: untilIso };
}

export function markKnownEntry(
  entry: ReviewScheduleEntry,
  now: string
): ReviewScheduleEntry {
  return { ...entry, markedKnownAt: now, suspendedUntil: null };
}

/**
 * `true` when the entry is elligible for today's queue given `now`. Items
 * that are snoozed, marked-known, or whose `dueAt` is still in the future are
 * excluded.
 */
export function isDue(entry: ReviewScheduleEntry, now: string): boolean {
  if (entry.markedKnownAt) return false;
  if (
    entry.suspendedUntil &&
    Date.parse(entry.suspendedUntil) > Date.parse(now)
  ) {
    return false;
  }
  return Date.parse(entry.dueAt) <= Date.parse(now);
}

function addDaysIso(nowIso: string, days: number): string {
  const base = Date.parse(nowIso);
  if (Number.isNaN(base)) return nowIso;
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
