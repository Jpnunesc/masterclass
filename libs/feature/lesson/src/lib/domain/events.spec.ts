import {
  LESSON_COMPLETED_SCHEMA_VERSION,
  SKILL_PRACTICED_SCHEMA_VERSION,
  isLessonCompletedEvent,
  isSkillPracticedEvent,
  type LessonCompletedEvent,
  type SkillPracticedEvent
} from './events';

describe('F2 event contracts', () => {
  it('accepts a well-formed SkillPracticed event', () => {
    const e: SkillPracticedEvent = {
      schemaVersion: SKILL_PRACTICED_SCHEMA_VERSION,
      type: 'SkillPracticed',
      lessonId: 'lesson-1',
      studentId: 'student-1',
      activityId: 'act-1',
      activityKind: 'speaking',
      skill: 'speak',
      cefrLevel: 'B1',
      quality: 0.72,
      durationMs: 45000,
      observedAt: '2026-04-20T12:00:00.000Z',
      locale: 'en'
    };
    expect(isSkillPracticedEvent(e)).toBe(true);
  });

  it('rejects a SkillPracticed event with a missing field', () => {
    const e = {
      schemaVersion: SKILL_PRACTICED_SCHEMA_VERSION,
      type: 'SkillPracticed',
      lessonId: 'lesson-1',
      studentId: 'student-1',
      activityId: 'act-1'
    };
    expect(isSkillPracticedEvent(e)).toBe(false);
  });

  it('accepts a well-formed LessonCompleted event', () => {
    const e: LessonCompletedEvent = {
      schemaVersion: LESSON_COMPLETED_SCHEMA_VERSION,
      type: 'LessonCompleted',
      lessonId: 'lesson-1',
      studentId: 'student-1',
      assessmentId: 'assess-1',
      cefrLevel: 'B1',
      activityIds: ['a1', 'a2', 'a3'],
      skillsPracticed: ['listen', 'speak', 'read', 'write'],
      averageQuality: 0.6,
      startedAt: '2026-04-20T12:00:00.000Z',
      completedAt: '2026-04-20T12:15:00.000Z',
      locale: 'pt-BR'
    };
    expect(isLessonCompletedEvent(e)).toBe(true);
  });

  it('rejects a LessonCompleted event with an invalid locale', () => {
    const e = {
      schemaVersion: LESSON_COMPLETED_SCHEMA_VERSION,
      type: 'LessonCompleted',
      lessonId: 'lesson-1',
      studentId: 'student-1',
      assessmentId: 'assess-1',
      cefrLevel: 'B1',
      activityIds: [],
      skillsPracticed: [],
      averageQuality: 0,
      startedAt: '2026-04-20T12:00:00.000Z',
      completedAt: '2026-04-20T12:15:00.000Z',
      locale: 'es'
    };
    expect(isLessonCompletedEvent(e)).toBe(false);
  });
});
