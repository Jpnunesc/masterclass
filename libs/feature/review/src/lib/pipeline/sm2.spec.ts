import {
  SM2_DEFAULT_EASE_FACTOR,
  SM2_MIN_EASE_FACTOR,
  applyGrade,
  freshEntry,
  isDue,
  markKnownEntry,
  snoozeEntry
} from './sm2';

const T0 = '2026-04-19T12:00:00.000Z';

describe('sm2', () => {
  it('freshEntry is due immediately and uses default ease factor', () => {
    const e = freshEntry('i1', T0);
    expect(e.easeFactor).toBe(SM2_DEFAULT_EASE_FACTOR);
    expect(e.repetitions).toBe(0);
    expect(e.intervalDays).toBe(0);
    expect(isDue(e, T0)).toBe(true);
  });

  it('good first review schedules +1 day and bumps repetitions', () => {
    const e = applyGrade(freshEntry('i1', T0), 'good', T0);
    expect(e.repetitions).toBe(1);
    expect(e.intervalDays).toBe(1);
    expect(Date.parse(e.dueAt)).toBe(Date.parse(T0) + 24 * 3600 * 1000);
  });

  it('second good review schedules +6 days', () => {
    const a = applyGrade(freshEntry('i1', T0), 'good', T0);
    const b = applyGrade(a, 'good', a.dueAt);
    expect(b.repetitions).toBe(2);
    expect(b.intervalDays).toBe(6);
  });

  it('third good review uses interval * easeFactor', () => {
    const a = applyGrade(freshEntry('i1', T0), 'good', T0);
    const b = applyGrade(a, 'good', a.dueAt);
    const c = applyGrade(b, 'good', b.dueAt);
    // 6 * (bumped easeFactor), rounded
    expect(c.intervalDays).toBe(Math.round(6 * b.easeFactor));
    expect(c.repetitions).toBe(3);
  });

  it('again resets repetitions and schedules +1 day', () => {
    const a = applyGrade(freshEntry('i1', T0), 'good', T0);
    const b = applyGrade(a, 'good', a.dueAt);
    const c = applyGrade(b, 'again', b.dueAt);
    expect(c.repetitions).toBe(0);
    expect(c.intervalDays).toBe(1);
    expect(c.easeFactor).toBeGreaterThanOrEqual(SM2_MIN_EASE_FACTOR);
  });

  it('ease factor floors at 1.3 after many agaings', () => {
    let e = freshEntry('i1', T0);
    for (let i = 0; i < 20; i++) e = applyGrade(e, 'again', e.dueAt);
    expect(e.easeFactor).toBe(SM2_MIN_EASE_FACTOR);
  });

  it('snooze hides item from today but not past its until date', () => {
    const e = applyGrade(freshEntry('i1', T0), 'good', T0);
    const snoozed = snoozeEntry(e, '2099-01-01T00:00:00.000Z');
    expect(isDue(snoozed, e.dueAt)).toBe(false);
    const cleared = snoozeEntry(e, '2020-01-01T00:00:00.000Z');
    expect(isDue(cleared, e.dueAt)).toBe(true);
  });

  it('markKnown permanently removes item from queue', () => {
    const e = markKnownEntry(freshEntry('i1', T0), T0);
    expect(isDue(e, '2099-01-01T00:00:00.000Z')).toBe(false);
  });

  it('replay is deterministic: same input → same output', () => {
    const a = applyGrade(freshEntry('i1', T0), 'good', T0);
    const b = applyGrade(freshEntry('i1', T0), 'good', T0);
    expect(a).toEqual(b);
  });
});
