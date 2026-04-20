import { TestBed } from '@angular/core/testing';

import {
  AZURE_OPENAI_JUDGE,
  ELEVENLABS_TTS,
  GROQ_STT,
  provideAssessmentStubs,
  type LevelAssessedEvent
} from '@feature/assessment';

import { LessonService } from './lesson.service';
import { provideLessonStubs } from './clients/stub-clients';
import {
  isLessonCompletedEvent,
  isSkillPracticedEvent,
  type LessonCompletedEvent,
  type SkillPracticedEvent
} from './domain/events';

function event(): LevelAssessedEvent {
  return {
    schemaVersion: 1,
    type: 'LevelAssessed',
    assessmentId: 'assess-x',
    studentId: 'student-x',
    level: 'B1',
    score: 0.55,
    confidence: 0.7,
    skills: {
      listen: { level: 'B1', score: 0.6 },
      speak: { level: 'A2', score: 0.4 },
      read: { level: 'B1', score: 0.5 },
      write: { level: 'B1', score: 0.55 }
    },
    subScores: { grammar: 0.5, vocabulary: 0.5 },
    startedAt: '2026-04-20T00:00:00.000Z',
    completedAt: '2026-04-20T00:05:00.000Z',
    locale: 'en'
  };
}

describe('LessonService', () => {
  let service: LessonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAssessmentStubs(), provideLessonStubs()]
    });
    TestBed.inject(AZURE_OPENAI_JUDGE);
    TestBed.inject(GROQ_STT);
    TestBed.inject(ELEVENLABS_TTS);
    service = TestBed.inject(LessonService);
  });

  it('plans from a LevelAssessed event and exposes the plan reactively', () => {
    const plan = service.planFrom(event(), 'lesson-1');
    expect(plan.id).toBe('lesson-1');
    expect(service.plan()?.id).toBe('lesson-1');
    expect(service.phase()).toBe('active');
    expect(service.currentActivity()).toBeTruthy();
  });

  it('emits a SkillPracticed event for each activity and a LessonCompleted at the end', () => {
    const plan = service.planFrom(event(), 'lesson-2');
    const total = plan.activities.length;
    for (let i = 0; i < total; i++) {
      service.recordActivitySignal(0.6, { quality: 0.6, hesitationMs: 1500 });
    }
    const emitted = service.emitted();
    const skills = emitted.filter((e): e is SkillPracticedEvent =>
      isSkillPracticedEvent(e)
    );
    const completions = emitted.filter((e): e is LessonCompletedEvent =>
      isLessonCompletedEvent(e)
    );
    expect(skills.length).toBe(total);
    expect(completions.length).toBe(1);
    expect(completions[0].activityIds.length).toBe(total);
    expect(service.phase()).toBe('completed');
  });
});
