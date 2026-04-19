import type { StartSessionInput } from '../domain/lesson-session.types';

import { SessionRecorder } from './recorder';

const startInput: StartSessionInput = {
  studentId: 'student-1',
  levelAtTime: 'B1',
  topic: 'travel',
  kind: 'lesson',
  locale: 'en',
  startedAt: '2026-04-10T10:00:00Z',
  participants: [
    { kind: 'student', displayName: 'You' },
    { kind: 'ai_teacher', displayName: 'Teacher' }
  ]
};

describe('SessionRecorder', () => {
  it('appends turns and corrections before finalizing', () => {
    const recorder = new SessionRecorder();
    recorder.start('session-1', startInput);

    const turn = recorder.appendTurn({
      sessionId: 'session-1',
      speaker: 'student',
      text: 'Hello.',
      occurredAt: '2026-04-10T10:00:15Z'
    });
    expect(turn?.id).toMatch(/^session-1-t-/);

    recorder.appendCorrection({
      sessionId: 'session-1',
      turnId: turn!.id,
      before: 'Hello.',
      after: 'Good morning.',
      note: 'Use a greeting appropriate to the time of day.'
    });

    const session = recorder.finalize({
      sessionId: 'session-1',
      completedAt: '2026-04-10T10:10:00Z',
      summary: 'Greetings practice',
      score: 0.85
    });

    expect(session).not.toBeNull();
    expect(session!.transcript.length).toBe(1);
    expect(session!.corrections.length).toBe(1);
    expect(session!.durationSeconds).toBe(600);
    expect(session!.score).toBe(0.85);
  });

  it('returns null when finalizing an unknown session', () => {
    const recorder = new SessionRecorder();
    const session = recorder.finalize({
      sessionId: 'missing',
      completedAt: '2026-04-10T10:10:00Z',
      summary: '',
      score: 0
    });
    expect(session).toBeNull();
  });

  it('discards a cancelled recording so stale fragments never persist', () => {
    const recorder = new SessionRecorder();
    recorder.start('session-2', startInput);
    recorder.appendTurn({
      sessionId: 'session-2',
      speaker: 'student',
      text: 'stray text',
      occurredAt: '2026-04-10T10:00:01Z'
    });
    recorder.cancel('session-2');
    expect(recorder.has('session-2')).toBe(false);
    expect(
      recorder.finalize({
        sessionId: 'session-2',
        completedAt: '2026-04-10T10:05:00Z',
        summary: '',
        score: 0
      })
    ).toBeNull();
  });
});
