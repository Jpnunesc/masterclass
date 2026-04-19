import type {
  LessonSession,
  LessonSessionId
} from '../domain/lesson-session.types';

/**
 * Minimal persistence surface. The prod build swaps this for a backend-backed
 * implementation; the in-memory store here keeps the dev harness deterministic
 * and lets specs assert ordering/deduplication without IO.
 */
export interface SessionStore {
  list(): readonly LessonSession[];
  get(id: LessonSessionId): LessonSession | null;
  upsert(session: LessonSession): LessonSession;
}

export class InMemorySessionStore implements SessionStore {
  private readonly byId = new Map<LessonSessionId, LessonSession>();

  list(): readonly LessonSession[] {
    return Array.from(this.byId.values()).sort((a, b) => {
      const atA = Date.parse(a.completedAt);
      const atB = Date.parse(b.completedAt);
      return atB - atA;
    });
  }

  get(id: LessonSessionId): LessonSession | null {
    return this.byId.get(id) ?? null;
  }

  upsert(session: LessonSession): LessonSession {
    this.byId.set(session.id, session);
    return session;
  }
}
