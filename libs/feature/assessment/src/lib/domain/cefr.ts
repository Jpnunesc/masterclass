export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const CEFR_ORDINALS: Readonly<Record<CefrLevel, number>> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5
};

export function levelFromOrdinal(ordinal: number): CefrLevel {
  const clamped = Math.max(0, Math.min(CEFR_LEVELS.length - 1, Math.round(ordinal)));
  return CEFR_LEVELS[clamped];
}

/**
 * Map a continuous 0..1 proficiency score to a CEFR level using equal-width
 * bands. Keeps scoring deterministic and easy to reason about in tests.
 */
export function levelFromScore(score: number): CefrLevel {
  if (Number.isNaN(score)) return 'A1';
  const clamped = Math.max(0, Math.min(1, score));
  const ordinal = Math.min(CEFR_LEVELS.length - 1, Math.floor(clamped * CEFR_LEVELS.length));
  return CEFR_LEVELS[ordinal];
}
