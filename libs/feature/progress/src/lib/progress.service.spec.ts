import { TestBed } from '@angular/core/testing';

import {
  LEVEL_ASSESSED_SCHEMA_VERSION,
  type LevelAssessedEvent
} from '@feature/assessment';
import { MATERIAL_VIEWED_SCHEMA_VERSION } from '@feature/materials';

import {
  LESSON_COMPLETED_SCHEMA_VERSION,
  type LessonCompletedEvent
} from './domain/lesson-completed.event';
import {
  SKILL_PRACTICED_SCHEMA_VERSION,
  type SkillPracticedEvent
} from './domain/skill-practiced.event';
import { isProgressUpdatedEvent } from './domain/progress-updated.event';
import {
  InMemoryProgressEventSink,
  PROGRESS_EVENT_SINK
} from './events/progress-events';
import { ProgressService } from './progress.service';
import { provideProgress } from './providers';

const assessed: LevelAssessedEvent = {
  schemaVersion: LEVEL_ASSESSED_SCHEMA_VERSION,
  type: 'LevelAssessed',
  assessmentId: 'asm-1',
  studentId: 's1',
  level: 'A2',
  score: 0.42,
  confidence: 0.6,
  skills: {
    listen: { level: 'A2', score: 0.4 },
    speak: { level: 'A1', score: 0.25 },
    read: { level: 'A2', score: 0.5 },
    write: { level: 'A2', score: 0.45 }
  },
  subScores: { grammar: 0.5, vocabulary: 0.4 },
  startedAt: '2026-04-10T09:00:00Z',
  completedAt: '2026-04-10T09:20:00Z',
  locale: 'en'
};

const lesson: LessonCompletedEvent = {
  schemaVersion: LESSON_COMPLETED_SCHEMA_VERSION,
  type: 'LessonCompleted',
  lessonId: 'ls-1',
  studentId: 's1',
  level: 'A2',
  topic: 'daily_life',
  kind: 'lesson',
  locale: 'en',
  completedAt: '2026-04-11T10:30:00Z',
  durationSeconds: 420,
  score: 0.55
};

describe('ProgressService (contract)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...provideProgress()] });
  });

  it('starts idempotently and exposes an initial snapshot', () => {
    const svc = TestBed.inject(ProgressService);
    svc.start('s1', '2026-04-10T00:00:00Z');
    svc.start('s1', '2026-04-10T00:00:00Z');
    expect(svc.snapshot()?.studentId).toBe('s1');
    expect(svc.snapshot()?.level).toBe('A1');
  });

  it('emits a schema-valid ProgressUpdated event after every ingest', () => {
    const svc = TestBed.inject(ProgressService);
    const sink = TestBed.inject(PROGRESS_EVENT_SINK) as InMemoryProgressEventSink;
    svc.start('s1', '2026-04-10T00:00:00Z');

    svc.ingestLevelAssessed(assessed);
    svc.ingestLessonCompleted(lesson);
    svc.ingestMaterialViewed({
      schemaVersion: MATERIAL_VIEWED_SCHEMA_VERSION,
      type: 'MaterialViewed',
      materialId: 'mat-1',
      studentId: 's1',
      kind: 'lesson',
      viewedAt: '2026-04-11T14:00:00Z',
      dwellMs: 9_000
    });
    const practice: SkillPracticedEvent = {
      schemaVersion: SKILL_PRACTICED_SCHEMA_VERSION,
      type: 'SkillPracticed',
      studentId: 's1',
      skill: 'speak',
      level: 'A2',
      score: 0.65,
      practicedAt: '2026-04-12T08:30:00Z',
      locale: 'en'
    };
    svc.ingestSkillPracticed(practice);

    const emitted = sink.progressUpdatedEvents();
    expect(emitted.length).toBe(4);
    expect(emitted.every(isProgressUpdatedEvent)).toBe(true);
    expect(emitted[emitted.length - 1].lessonsCompleted).toBe(1);
    expect(svc.snapshot()?.streakDays).toBeGreaterThanOrEqual(2);
  });

  it('caps the timeline so 1_000 ingests stay bounded', () => {
    const svc = TestBed.inject(ProgressService);
    svc.start('s1', '2026-04-10T00:00:00Z');
    for (let i = 0; i < 1_000; i++) {
      svc.ingestLessonCompleted({
        ...lesson,
        lessonId: `ls-${i}`,
        completedAt: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
        score: (i % 100) / 100
      });
    }
    expect(svc.timeline().length).toBeLessThanOrEqual(500);
    expect(svc.snapshot()?.lessonsCompleted).toBe(1_000);
  });

  it('returns stub goals from refreshGoals', async () => {
    const svc = TestBed.inject(ProgressService);
    svc.start('s1', '2026-04-10T00:00:00Z');
    svc.ingestLevelAssessed(assessed);
    const goals = await svc.refreshGoals();
    expect(goals.length).toBeGreaterThan(0);
    expect(goals[0].origin).toBe('heuristic');
  });
});
