import { computeStreaks, toUtcDayKey } from './streak';

describe('streak', () => {
  it('returns zeroed stats for an empty list', () => {
    const result = computeStreaks([]);
    expect(result).toEqual({ current: 0, longest: 0, lastDayKey: null });
  });

  it('counts a run of consecutive UTC days', () => {
    const result = computeStreaks([
      '2026-04-12T10:00:00Z',
      '2026-04-13T22:30:00Z',
      '2026-04-14T01:15:00Z'
    ]);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
    expect(result.lastDayKey).toBe('2026-04-14');
  });

  it('resets when a day is skipped', () => {
    const result = computeStreaks([
      '2026-04-10T10:00:00Z',
      '2026-04-11T10:00:00Z',
      '2026-04-13T10:00:00Z'
    ]);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(2);
    expect(result.lastDayKey).toBe('2026-04-13');
  });

  it('collapses multiple events on the same UTC day', () => {
    const result = computeStreaks([
      '2026-04-12T01:00:00Z',
      '2026-04-12T15:30:00Z'
    ]);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });

  it('maps ISO timestamps to stable UTC day keys', () => {
    expect(toUtcDayKey('2026-04-12T23:59:59Z')).toBe('2026-04-12');
    expect(toUtcDayKey('not-a-date')).toBeNull();
  });
});
