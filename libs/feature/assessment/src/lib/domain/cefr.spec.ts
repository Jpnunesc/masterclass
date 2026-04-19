import { CEFR_LEVELS, levelFromOrdinal, levelFromScore } from './cefr';

describe('CEFR level mapping', () => {
  it('maps each equal-width band to the expected level', () => {
    const bandWidth = 1 / CEFR_LEVELS.length;
    CEFR_LEVELS.forEach((level, i) => {
      const mid = bandWidth * i + bandWidth / 2;
      expect(levelFromScore(mid)).toBe(level);
    });
  });

  it('clamps scores outside [0,1]', () => {
    expect(levelFromScore(-1)).toBe('A1');
    expect(levelFromScore(2)).toBe('C2');
  });

  it('returns A1 for NaN input', () => {
    expect(levelFromScore(Number.NaN)).toBe('A1');
  });

  it('maps ordinals to levels with clamping', () => {
    expect(levelFromOrdinal(-5)).toBe('A1');
    expect(levelFromOrdinal(0)).toBe('A1');
    expect(levelFromOrdinal(3)).toBe('B2');
    expect(levelFromOrdinal(99)).toBe('C2');
  });
});
