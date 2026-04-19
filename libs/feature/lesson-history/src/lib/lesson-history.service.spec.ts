import { TestBed } from '@angular/core/testing';

import { LessonHistoryService } from './lesson-history.service';
import {
  InMemoryLessonHistoryEventSink,
  LESSON_HISTORY_EVENT_SINK
} from './events/lesson-history-events';
import type { StartSessionInput } from './domain/lesson-session.types';

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

describe('LessonHistoryService', () => {
  let sink: InMemoryLessonHistoryEventSink;

  beforeEach(() => {
    sink = new InMemoryLessonHistoryEventSink();
    TestBed.configureTestingModule({
      providers: [
        { provide: LESSON_HISTORY_EVENT_SINK, useValue: sink },
        LessonHistoryService
      ]
    });
  });

  it('emits LessonCompleted when a recording finalizes', () => {
    const svc = TestBed.inject(LessonHistoryService);
    const id = svc.startSession(startInput);
    svc.appendTurn({
      sessionId: id,
      speaker: 'student',
      text: 'I would like a coffee, please.',
      occurredAt: '2026-04-10T10:01:00Z'
    });
    const session = svc.completeSession({
      sessionId: id,
      completedAt: '2026-04-10T10:10:00Z',
      summary: 'Ordering coffee',
      score: 0.9
    });
    expect(session?.id).toBe(id);
    expect(svc.sessions().length).toBe(1);

    const events = sink.lessonCompletedEvents();
    expect(events.length).toBe(1);
    expect(events[0].schemaVersion).toBe(1);
    expect(events[0].type).toBe('LessonCompleted');
    expect(events[0].lessonId).toBe(id);
    expect(events[0].level).toBe('B1');
    expect(events[0].topic).toBe('travel');
    expect(events[0].durationSeconds).toBe(600);
    expect(events[0].score).toBe(0.9);
  });

  it('filters visible sessions by search text, level, and topic', () => {
    const svc = TestBed.inject(LessonHistoryService);
    svc.seed([
      {
        id: 'a',
        studentId: 'student-1',
        startedAt: '2026-04-09T10:00:00Z',
        completedAt: '2026-04-09T10:20:00Z',
        levelAtTime: 'A2',
        topic: 'daily_life',
        kind: 'lesson',
        locale: 'en',
        participants: [],
        summary: 'Morning routine small talk',
        transcript: [],
        corrections: [],
        pronunciationDeltas: [],
        durationSeconds: 1200,
        score: 0.7
      },
      {
        id: 'b',
        studentId: 'student-1',
        startedAt: '2026-04-10T10:00:00Z',
        completedAt: '2026-04-10T10:22:00Z',
        levelAtTime: 'B1',
        topic: 'travel',
        kind: 'lesson',
        locale: 'en',
        participants: [],
        summary: 'Airport check-in roleplay',
        transcript: [],
        corrections: [],
        pronunciationDeltas: [],
        durationSeconds: 1320,
        score: 0.82
      }
    ]);
    svc.setSearchText('airport');
    expect(svc.visibleSessions().map((s) => s.id)).toEqual(['b']);

    svc.setSearchText('');
    svc.setLevelFilter('A2');
    expect(svc.visibleSessions().map((s) => s.id)).toEqual(['a']);
  });

  it('tracks last search duration in ms for observability', () => {
    const svc = TestBed.inject(LessonHistoryService);
    svc.seed([]);
    svc.setSearchText('anything');
    expect(svc.lastSearchDurationMs()).toBeGreaterThanOrEqual(0);
  });
});
