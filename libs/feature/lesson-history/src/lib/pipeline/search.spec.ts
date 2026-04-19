import type { LessonSession } from '../domain/lesson-session.types';

import { buildSearchIndex, searchSessions } from './search';

function makeSession(
  overrides: Partial<LessonSession> & Pick<LessonSession, 'id'>
): LessonSession {
  const base: LessonSession = {
    id: overrides.id,
    studentId: 'student-1',
    startedAt: '2026-04-10T10:00:00Z',
    completedAt: '2026-04-10T10:20:00Z',
    levelAtTime: 'B1',
    topic: 'travel',
    kind: 'lesson',
    locale: 'en',
    participants: [
      { kind: 'student', displayName: 'You' },
      { kind: 'ai_teacher', displayName: 'Teacher' }
    ],
    summary: 'Airport roleplay',
    transcript: [
      {
        id: `${overrides.id}-t-1`,
        speaker: 'ai_teacher',
        occurredAt: '2026-04-10T10:00:00Z',
        text: 'Welcome to check-in.',
        confidence: 1
      }
    ],
    corrections: [],
    pronunciationDeltas: [],
    durationSeconds: 1200,
    score: 0.8
  };
  return { ...base, ...overrides };
}

describe('search', () => {
  it('returns all sessions on an empty query', () => {
    const sessions = [makeSession({ id: 'a' }), makeSession({ id: 'b' })];
    const index = buildSearchIndex(sessions);
    const result = searchSessions(sessions, index, {
      text: '',
      level: 'all',
      topic: 'all'
    });
    expect(result.sessions.length).toBe(2);
  });

  it('matches against the transcript body case-insensitively', () => {
    const a = makeSession({ id: 'a' });
    const b = makeSession({
      id: 'b',
      transcript: [
        {
          id: 'b-t-1',
          speaker: 'student',
          occurredAt: '2026-04-10T10:01:00Z',
          text: 'I ordered a Cappuccino at the café.',
          confidence: 1
        }
      ]
    });
    const sessions = [a, b];
    const index = buildSearchIndex(sessions);
    const result = searchSessions(sessions, index, {
      text: 'CAPPUCCINO',
      level: 'all',
      topic: 'all'
    });
    expect(result.sessions.map((s) => s.id)).toEqual(['b']);
  });

  it('narrows by level and topic together', () => {
    const sessions = [
      makeSession({ id: 'a', levelAtTime: 'A2', topic: 'daily_life' }),
      makeSession({ id: 'b', levelAtTime: 'B1', topic: 'travel' }),
      makeSession({ id: 'c', levelAtTime: 'B1', topic: 'work' })
    ];
    const index = buildSearchIndex(sessions);
    const result = searchSessions(sessions, index, {
      text: '',
      level: 'B1',
      topic: 'work'
    });
    expect(result.sessions.map((s) => s.id)).toEqual(['c']);
  });

  it('stays under the 500ms target for 1k sessions', () => {
    const sessions = Array.from({ length: 1000 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        transcript: [
          {
            id: `s-${i}-t-1`,
            speaker: 'student',
            occurredAt: '2026-04-10T10:01:00Z',
            text:
              i === 723
                ? 'needle match inside body'
                : 'lorem ipsum conversation about travel',
            confidence: 1
          }
        ]
      })
    );
    const index = buildSearchIndex(sessions);
    const result = searchSessions(sessions, index, {
      text: 'needle',
      level: 'all',
      topic: 'all'
    });
    expect(result.sessions.map((s) => s.id)).toEqual(['s-723']);
    expect(result.durationMs).toBeLessThan(500);
  });
});
