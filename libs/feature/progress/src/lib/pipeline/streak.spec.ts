import { activeDays14, computeStreaks, toUtcDayKey } from './streak';

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

describe('activeDays14', () => {
  const now = Date.parse('2026-04-19T12:00:00Z');

  it('returns exactly 14 entries ending on today', () => {
    const days = activeDays14([], now);
    expect(days.length).toBe(14);
    expect(days[0].dayKey).toBe('2026-04-06');
    expect(days[13].dayKey).toBe('2026-04-19');
    expect(days[13].today).toBe(true);
    expect(days[0].today).toBe(false);
  });

  it('marks days on which any activity occurred as active', () => {
    const days = activeDays14(
      [
        '2026-04-19T08:00:00Z',
        '2026-04-18T23:45:00Z',
        '2026-04-10T10:00:00Z'
      ],
      now
    );
    const activeKeys = days.filter((d) => d.active).map((d) => d.dayKey);
    expect(activeKeys).toEqual(['2026-04-10', '2026-04-18', '2026-04-19']);
  });

  it('leaves every dot inactive when there is no history', () => {
    const days = activeDays14([], now);
    expect(days.every((d) => !d.active)).toBe(true);
  });
});
