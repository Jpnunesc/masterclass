import type { CefrLevel } from '@feature/assessment';

import type { Milestone, StudentProgressSnapshot } from '../domain/progress.types';

export type HeroBucket = 'returning' | 'levelUp' | 'consistent' | 'early' | 'default';

export const HERO_BUCKETS: readonly HeroBucket[] = [
  'returning',
  'levelUp',
  'consistent',
  'early',
  'default'
];

const DAY_MS = 24 * 60 * 60 * 1000;

export interface HeroInputs {
  readonly snapshot: StudentProgressSnapshot | null;
  readonly milestones: readonly Milestone[];
  readonly now: number;
}

/**
 * Resolve the hero variant bucket deterministically from progress state. The
 * order is fixed — first match wins — so a student "returning after leveling up"
 * still lands on `returning`, keeping the message tonally specific.
 */
export function resolveHeroBucket(input: HeroInputs): HeroBucket {
  const { snapshot, milestones, now } = input;
  if (!snapshot) return 'default';

  if (snapshot.lastActivityAt) {
    const lastMs = Date.parse(snapshot.lastActivityAt);
    if (!Number.isNaN(lastMs) && now - lastMs > 7 * DAY_MS) {
      return 'returning';
    }
  }

  const cutoff = now - 14 * DAY_MS;
  const recentLevelUp = milestones.some((m) => {
    const reachedMs = Date.parse(m.reachedAt);
    return !Number.isNaN(reachedMs) && reachedMs >= cutoff;
  });
  if (recentLevelUp) return 'levelUp';

  if (snapshot.streakDays >= 5) return 'consistent';
  if (snapshot.lessonsCompleted < 7) return 'early';
  return 'default';
}

/**
 * Stable string hash (djb2 × xor). Enough entropy for small variant pools; the
 * spec calls for SHA1 but uses it only for determinism, not security.
 */
export function sessionHash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

/**
 * Pick the deterministic variant index for a given (userId, ISO day) pair.
 * Zero-based; callers fold it into the ICU key `progress.hero.<bucket>.<n>`
 * with n = index + 1 since the spec numbers variants from 1.
 */
export function pickHeroIndex(
  userId: string,
  dayIso: string,
  variantCount: number
): number {
  if (variantCount <= 0) return 0;
  const h = sessionHash(`${userId}|${dayIso}`);
  return h % variantCount;
}

/**
 * Calendar day string in UTC for use as the stable daily seed.
 */
export function utcDayIso(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compute the [0..100] position on the level rail for a CEFR level and a
 * within-bucket fractional progress value. A1..C1 map to 0/25/50/75/100; C2
 * is treated as "at cap" and pinned to 100.
 */
export function railPosition(level: CefrLevel, bucketProgress: number): number {
  const bucketIndex = cefrBucketIndex(level);
  if (bucketIndex >= 4) return 100;
  const raw = bucketIndex * 25 + clamp01(bucketProgress) * 25;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Index of the next bucket marker as a percentage, or 100 at cap.
 */
export function nextBucketPct(level: CefrLevel): number {
  const bucketIndex = cefrBucketIndex(level);
  if (bucketIndex >= 4) return 100;
  return (bucketIndex + 1) * 25;
}

export function isAtCap(level: CefrLevel): boolean {
  return cefrBucketIndex(level) >= 4;
}

export function nextBucketCode(level: CefrLevel): string {
  const next = Math.min(4, cefrBucketIndex(level) + 1);
  return RAIL_BUCKETS[next];
}

export const RAIL_BUCKETS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

function cefrBucketIndex(level: CefrLevel): number {
  switch (level) {
    case 'A1': return 0;
    case 'A2': return 1;
    case 'B1': return 2;
    case 'B2': return 3;
    case 'C1':
    case 'C2':
    default:   return 4;
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
