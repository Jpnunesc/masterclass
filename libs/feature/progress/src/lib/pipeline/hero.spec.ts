import {
  isAtCap,
  nextBucketCode,
  nextBucketPct,
  pickHeroIndex,
  railPosition,
  resolveHeroBucket,
  sessionHash,
  utcDayIso
} from './hero';
import type { Milestone, StudentProgressSnapshot } from '../domain/progress.types';
import { emptySnapshot } from '../domain/progress.types';

function snapshotWith(
  overrides: Partial<StudentProgressSnapshot>
): StudentProgressSnapshot {
  const base = emptySnapshot('s1', '2026-04-01T00:00:00Z');
  return { ...base, ...overrides };
}

const NOW = Date.parse('2026-04-19T12:00:00Z');

describe('resolveHeroBucket', () => {
  it('falls back to default when the snapshot is null', () => {
    expect(
      resolveHeroBucket({ snapshot: null, milestones: [], now: NOW })
    ).toBe('default');
  });

  it('chooses returning when last activity is older than 7 days', () => {
    const snap = snapshotWith({
      lastActivityAt: '2026-04-10T00:00:00Z',
      lessonsCompleted: 12
    });
    expect(resolveHeroBucket({ snapshot: snap, milestones: [], now: NOW })).toBe(
      'returning'
    );
  });

  it('picks levelUp when a milestone was reached in the last 14 days', () => {
    const snap = snapshotWith({
      lastActivityAt: '2026-04-18T00:00:00Z',
      lessonsCompleted: 12,
      streakDays: 2
    });
    const milestones: Milestone[] = [
      {
        id: 'm1',
        label: 'Reached B1',
        detail: '',
        reachedAt: '2026-04-15T00:00:00Z'
      }
    ];
    expect(
      resolveHeroBucket({ snapshot: snap, milestones, now: NOW })
    ).toBe('levelUp');
  });

  it('picks consistent at streak >= 5 when no recent level up', () => {
    const snap = snapshotWith({
      lastActivityAt: '2026-04-19T00:00:00Z',
      streakDays: 6,
      lessonsCompleted: 20
    });
    expect(resolveHeroBucket({ snapshot: snap, milestones: [], now: NOW })).toBe(
      'consistent'
    );
  });

  it('picks early when total completed lessons is under 7', () => {
    const snap = snapshotWith({
      lastActivityAt: '2026-04-19T00:00:00Z',
      streakDays: 2,
      lessonsCompleted: 3
    });
    expect(resolveHeroBucket({ snapshot: snap, milestones: [], now: NOW })).toBe(
      'early'
    );
  });

  it('falls through to default otherwise', () => {
    const snap = snapshotWith({
      lastActivityAt: '2026-04-19T00:00:00Z',
      streakDays: 2,
      lessonsCompleted: 40
    });
    expect(resolveHeroBucket({ snapshot: snap, milestones: [], now: NOW })).toBe(
      'default'
    );
  });

  it('returning outranks levelUp when both match (first wins per spec)', () => {
    const snap = snapshotWith({
      lastActivityAt: '2026-04-05T00:00:00Z',
      lessonsCompleted: 12
    });
    const milestones: Milestone[] = [
      {
        id: 'm1',
        label: 'Reached B1',
        detail: '',
        reachedAt: '2026-04-15T00:00:00Z'
      }
    ];
    expect(
      resolveHeroBucket({ snapshot: snap, milestones, now: NOW })
    ).toBe('returning');
  });
});

describe('pickHeroIndex', () => {
  it('is stable across calls for the same (userId, day) pair', () => {
    const a = pickHeroIndex('user-1', '2026-04-19', 5);
    const b = pickHeroIndex('user-1', '2026-04-19', 5);
    expect(a).toBe(b);
  });

  it('returns 0 for a zero variant count', () => {
    expect(pickHeroIndex('user-1', '2026-04-19', 0)).toBe(0);
  });

  it('stays within the variant range', () => {
    for (let i = 0; i < 50; i++) {
      const idx = pickHeroIndex(`user-${i}`, '2026-04-19', 4);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(4);
    }
  });
});

describe('rail geometry', () => {
  it('maps A1..C1 to 0/25/50/75/100 at the start of each bucket', () => {
    expect(railPosition('A1', 0)).toBe(0);
    expect(railPosition('A2', 0)).toBe(25);
    expect(railPosition('B1', 0)).toBe(50);
    expect(railPosition('B2', 0)).toBe(75);
    expect(railPosition('C1', 0)).toBe(100);
  });

  it('advances linearly within a bucket segment', () => {
    expect(railPosition('A2', 0.4)).toBe(35); // 25 + 10
    expect(railPosition('B1', 1)).toBe(75); // clamped to end of segment
  });

  it('pins C2 to 100 (at cap)', () => {
    expect(railPosition('C2', 0.5)).toBe(100);
  });

  it('reports atCap only for C1 and above', () => {
    expect(isAtCap('B2')).toBe(false);
    expect(isAtCap('C1')).toBe(true);
    expect(isAtCap('C2')).toBe(true);
  });

  it('reports the next tick for a mid-ladder learner', () => {
    expect(nextBucketPct('A2')).toBe(50);
    expect(nextBucketPct('B1')).toBe(75);
    expect(nextBucketPct('C1')).toBe(100);
  });

  it('names the next bucket code correctly', () => {
    expect(nextBucketCode('A1')).toBe('A2');
    expect(nextBucketCode('B2')).toBe('C1');
    expect(nextBucketCode('C1')).toBe('C1');
  });
});

describe('sessionHash + utcDayIso', () => {
  it('returns a positive unsigned integer', () => {
    expect(sessionHash('abc')).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(sessionHash('abc'))).toBe(true);
  });

  it('formats UTC day keys in YYYY-MM-DD', () => {
    expect(utcDayIso(Date.parse('2026-04-19T23:59:59Z'))).toBe('2026-04-19');
  });
});
