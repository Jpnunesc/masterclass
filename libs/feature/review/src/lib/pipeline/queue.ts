import type { AssessmentSkill } from '@feature/assessment';

import type {
  ReviewItem,
  ReviewQueueEntry,
  ReviewScheduleEntry,
  ReviewScheduleState,
  ReviewSkill
} from '../domain/review.types';
import { isDue } from './sm2';

export interface QueueOptions {
  readonly now: string;
  /** Upper bound on queue length. 0 = no cap. */
  readonly limit?: number;
}

/**
 * Deterministic daily queue. Ordering contract:
 *   1. skill-weakness rank first (items tied to weak F4 skills before strong ones)
 *   2. dueAt ascending (oldest overdue first)
 *   3. easeFactor ascending (struggling items before easy ones)
 *   4. itemId lexicographic (stable tiebreaker)
 *
 * Dedup: each itemId appears at most once — the Map structure guarantees it.
 */
export function buildQueue(
  schedule: ReviewScheduleState,
  options: QueueOptions
): readonly ReviewQueueEntry[] {
  const { now, limit = 0 } = options;
  const weakRank = weakSkillRanking(schedule.weakSkills);

  const candidates: ReviewQueueEntry[] = [];
  schedule.entries.forEach((entry, id) => {
    if (!isDue(entry, now)) return;
    const item = schedule.items.get(id);
    if (!item) return;
    candidates.push({ item, entry });
  });

  candidates.sort((a, b) => compare(a, b, weakRank));

  if (limit > 0 && candidates.length > limit) {
    return candidates.slice(0, limit);
  }
  return candidates;
}

/**
 * Count distinct ReviewSkills across the queue. Used by acceptance assertion
 * (≥10 items covering ≥2 skills).
 */
export function skillsInQueue(
  queue: readonly ReviewQueueEntry[]
): readonly ReviewSkill[] {
  const seen = new Set<ReviewSkill>();
  for (const q of queue) seen.add(q.item.skill);
  return Array.from(seen).sort();
}

function compare(
  a: ReviewQueueEntry,
  b: ReviewQueueEntry,
  weakRank: ReadonlyMap<ReviewSkill, number>
): number {
  const aRank = weakRank.get(a.item.skill) ?? Number.MAX_SAFE_INTEGER;
  const bRank = weakRank.get(b.item.skill) ?? Number.MAX_SAFE_INTEGER;
  if (aRank !== bRank) return aRank - bRank;

  const aDue = Date.parse(a.entry.dueAt);
  const bDue = Date.parse(b.entry.dueAt);
  if (aDue !== bDue) return aDue - bDue;

  if (a.entry.easeFactor !== b.entry.easeFactor) {
    return a.entry.easeFactor - b.entry.easeFactor;
  }

  return a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0;
}

/**
 * Map each review skill to a priority score given F4's list of weak assessment
 * skills. Lower rank = higher priority in the queue.
 *
 * The F4 skill taxonomy (listen/speak/read/write) maps imperfectly onto
 * review skills (vocabulary/grammar/listening/reading). We do a best-effort
 * projection: listen→listening, read→reading, write→vocabulary+grammar,
 * speak→vocabulary. Unranked review skills use MAX_SAFE_INTEGER so they
 * sort deterministically after ranked ones.
 */
function weakSkillRanking(
  weak: readonly AssessmentSkill[]
): ReadonlyMap<ReviewSkill, number> {
  const out = new Map<ReviewSkill, number>();
  let rank = 0;
  for (const w of weak) {
    const mapped = projectWeakSkill(w);
    for (const ms of mapped) {
      if (!out.has(ms)) out.set(ms, rank);
    }
    rank += 1;
  }
  return out;
}

function projectWeakSkill(skill: AssessmentSkill): readonly ReviewSkill[] {
  switch (skill) {
    case 'listen':
      return ['listening'];
    case 'read':
      return ['reading'];
    case 'write':
      return ['grammar', 'vocabulary'];
    case 'speak':
      return ['vocabulary'];
    default:
      return [];
  }
}

export function putItem(
  schedule: ReviewScheduleState,
  item: ReviewItem,
  entry: ReviewScheduleEntry,
  now: string
): ReviewScheduleState {
  const items = new Map(schedule.items);
  const entries = new Map(schedule.entries);
  items.set(item.id, item);
  entries.set(item.id, entry);
  return { ...schedule, items, entries, updatedAt: now };
}

export function updateEntry(
  schedule: ReviewScheduleState,
  entry: ReviewScheduleEntry,
  now: string
): ReviewScheduleState {
  if (!schedule.items.has(entry.itemId)) return schedule;
  const entries = new Map(schedule.entries);
  entries.set(entry.itemId, entry);
  return { ...schedule, entries, updatedAt: now };
}

export function setWeakSkills(
  schedule: ReviewScheduleState,
  weak: readonly AssessmentSkill[],
  now: string
): ReviewScheduleState {
  return { ...schedule, weakSkills: weak, updatedAt: now };
}
