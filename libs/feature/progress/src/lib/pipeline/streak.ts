/**
 * Compute streak days from a sorted list of ISO timestamps. A streak is a run
 * of consecutive calendar days (in UTC) that contain at least one activity
 * event. The function returns both the current run (ending on the latest
 * activity) and the longest run ever observed.
 *
 * We operate in UTC so the result is stable across timezones — the API also
 * stores activity dates as ISO strings. If a product decision later wants
 * per-user timezones, swap `toUtcDayKey` for a locale-aware variant.
 */
export interface StreakStats {
  readonly current: number;
  readonly longest: number;
  readonly lastDayKey: string | null;
}

export function computeStreaks(timestamps: readonly string[]): StreakStats {
  if (timestamps.length === 0) {
    return { current: 0, longest: 0, lastDayKey: null };
  }

  const keys = new Set<string>();
  for (const ts of timestamps) {
    const key = toUtcDayKey(ts);
    if (key) keys.add(key);
  }

  const ordered = [...keys].sort();
  if (ordered.length === 0) {
    return { current: 0, longest: 0, lastDayKey: null };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const curr = ordered[i];
    if (isNextDay(prev, curr)) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const lastDayKey = ordered[ordered.length - 1];

  // `current` counts backwards from the most-recent day with activity; it is
  // the most meaningful number to show on the dashboard for an active learner.
  let current = 1;
  for (let i = ordered.length - 2; i >= 0; i--) {
    if (isNextDay(ordered[i], ordered[i + 1])) current += 1;
    else break;
  }

  return { current, longest, lastDayKey };
}

export function toUtcDayKey(iso: string): string | null {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return msToUtcDayKey(parsed);
}

function msToUtcDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface ActiveDay {
  readonly dayKey: string;
  readonly active: boolean;
  readonly today: boolean;
}

/**
 * Build the 14-day active/inactive strip ending on the day represented by
 * `nowMs`. The result is ordered oldest → today, which matches the spec's
 * left-to-right render order.
 */
export function activeDays14(
  timestamps: readonly string[],
  nowMs: number
): readonly ActiveDay[] {
  const DAY = 24 * 60 * 60 * 1000;
  const todayUtcStart = Math.floor(nowMs / DAY) * DAY;
  const keys = new Set<string>();
  for (const ts of timestamps) {
    const key = toUtcDayKey(ts);
    if (key) keys.add(key);
  }
  const out: ActiveDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const ms = todayUtcStart - i * DAY;
    const dayKey = msToUtcDayKey(ms);
    out.push({
      dayKey,
      active: keys.has(dayKey),
      today: i === 0
    });
  }
  return out;
}

function isNextDay(prevKey: string, currKey: string): boolean {
  const prev = Date.parse(`${prevKey}T00:00:00Z`);
  const curr = Date.parse(`${currKey}T00:00:00Z`);
  if (Number.isNaN(prev) || Number.isNaN(curr)) return false;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return curr - prev === oneDayMs;
}
