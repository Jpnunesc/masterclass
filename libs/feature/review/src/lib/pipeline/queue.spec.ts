import type {
  ReviewItem,
  ReviewScheduleEntry,
  ReviewScheduleState,
  ReviewSkill
} from '../domain/review.types';
import { EMPTY_REVIEW_SCHEDULE } from '../domain/review.types';
import { buildQueue, putItem, setWeakSkills, skillsInQueue } from './queue';
import { freshEntry } from './sm2';

const T0 = '2026-04-19T12:00:00.000Z';

function makeItem(id: string, skill: ReviewSkill): ReviewItem {
  return {
    id,
    studentId: 's1',
    skill,
    topic: 'daily_life',
    level: 'B1',
    prompt: `prompt-${id}`,
    answer: `answer-${id}`,
    sourceMaterialId: null,
    locale: 'en'
  };
}

function seed(
  schedule: ReviewScheduleState,
  id: string,
  skill: ReviewSkill,
  entryOverride: Partial<ReviewScheduleEntry> = {}
): ReviewScheduleState {
  const entry = { ...freshEntry(id, T0), ...entryOverride };
  return putItem(schedule, makeItem(id, skill), entry, T0);
}

describe('buildQueue', () => {
  it('returns only due items and dedupes by id', () => {
    let s = EMPTY_REVIEW_SCHEDULE;
    s = seed(s, 'a', 'vocabulary');
    s = seed(s, 'b', 'grammar', {
      dueAt: '2099-01-01T00:00:00.000Z',
      intervalDays: 30
    });
    s = seed(s, 'a', 'vocabulary'); // same id → overwrite, not dupe
    const q = buildQueue(s, { now: T0 });
    expect(q.map((e) => e.item.id)).toEqual(['a']);
  });

  it('satisfies acceptance: ≥10 items across ≥2 skills', () => {
    let s = EMPTY_REVIEW_SCHEDULE;
    for (let i = 0; i < 6; i++) s = seed(s, `v${i}`, 'vocabulary');
    for (let i = 0; i < 6; i++) s = seed(s, `g${i}`, 'grammar');
    const q = buildQueue(s, { now: T0 });
    expect(q.length).toBeGreaterThanOrEqual(10);
    expect(skillsInQueue(q).length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic given identical inputs', () => {
    let s = EMPTY_REVIEW_SCHEDULE;
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (const id of ids) s = seed(s, id, 'vocabulary');
    const a = buildQueue(s, { now: T0 });
    const b = buildQueue(s, { now: T0 });
    expect(a.map((e) => e.item.id)).toEqual(b.map((e) => e.item.id));
  });

  it('weak skills sort before stronger ones', () => {
    let s = EMPTY_REVIEW_SCHEDULE;
    s = seed(s, 'v1', 'vocabulary');
    s = seed(s, 'g1', 'grammar');
    s = seed(s, 'l1', 'listening');
    s = setWeakSkills(s, ['listen'], T0);
    const q = buildQueue(s, { now: T0 });
    expect(q[0].item.id).toBe('l1');
  });

  it('respects limit', () => {
    let s = EMPTY_REVIEW_SCHEDULE;
    for (let i = 0; i < 20; i++) s = seed(s, `v${i}`, 'vocabulary');
    const q = buildQueue(s, { now: T0, limit: 5 });
    expect(q.length).toBe(5);
  });

  it('skips snoozed and marked-known items', () => {
    let s = EMPTY_REVIEW_SCHEDULE;
    s = seed(s, 'a', 'vocabulary');
    s = seed(s, 'b', 'vocabulary', {
      suspendedUntil: '2099-01-01T00:00:00.000Z'
    });
    s = seed(s, 'c', 'vocabulary', { markedKnownAt: T0 });
    const q = buildQueue(s, { now: T0 });
    expect(q.map((e) => e.item.id)).toEqual(['a']);
  });

  it('ties broken by easeFactor then id for deterministic order', () => {
    let s = EMPTY_REVIEW_SCHEDULE;
    s = seed(s, 'z', 'vocabulary', { easeFactor: 2.3 });
    s = seed(s, 'a', 'vocabulary', { easeFactor: 2.3 });
    s = seed(s, 'm', 'vocabulary', { easeFactor: 2.1 });
    const q = buildQueue(s, { now: T0 });
    expect(q.map((e) => e.item.id)).toEqual(['m', 'a', 'z']);
  });
});
