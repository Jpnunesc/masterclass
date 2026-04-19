import type {
  LessonSession,
  SessionSearchQuery
} from '../domain/lesson-session.types';

/**
 * Normalizes to lowercase + collapses whitespace so equality checks are
 * locale-stable. `toLocaleLowerCase` so Portuguese accents fold consistently.
 */
export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

interface HaystackEntry {
  readonly id: string;
  readonly haystack: string;
}

/**
 * Precomputes a concatenated search haystack per session (summary + transcript
 * text + topic + level). Keeping the haystack per-session avoids rebuilding on
 * every keystroke — the service rebuilds only when the session list changes.
 */
export function buildSearchIndex(
  sessions: readonly LessonSession[]
): readonly HaystackEntry[] {
  return sessions.map((session) => {
    const transcript = session.transcript
      .map((turn) => turn.text)
      .join(' ');
    const haystack = [
      session.summary,
      transcript,
      session.topic.replace(/_/g, ' '),
      session.levelAtTime,
      session.kind
    ]
      .join(' ')
      .toLocaleLowerCase();
    return { id: session.id, haystack };
  });
}

export interface SearchOutcome {
  readonly sessions: readonly LessonSession[];
  readonly durationMs: number;
}

/**
 * Linear filter suitable for up to ~1k sessions (MVP target). Returns newest
 * first — callers pass sessions already sorted by completedAt desc. Exits early
 * on empty query to preserve O(1) behavior in the common case.
 */
export function searchSessions(
  sessions: readonly LessonSession[],
  index: readonly HaystackEntry[],
  query: SessionSearchQuery
): SearchOutcome {
  const needle = normalizeSearchText(query.text);
  const started = performanceNowSafe();
  if (
    needle.length === 0 &&
    query.level === 'all' &&
    query.topic === 'all'
  ) {
    return { sessions, durationMs: performanceNowSafe() - started };
  }
  const byId = new Map(index.map((entry) => [entry.id, entry.haystack]));
  const out = sessions.filter((session) => {
    if (query.level !== 'all' && session.levelAtTime !== query.level) {
      return false;
    }
    if (query.topic !== 'all' && session.topic !== query.topic) {
      return false;
    }
    if (needle.length === 0) return true;
    const haystack = byId.get(session.id);
    return haystack !== undefined && haystack.includes(needle);
  });
  return { sessions: out, durationMs: performanceNowSafe() - started };
}

function performanceNowSafe(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}
