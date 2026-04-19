import {
  LEVEL_ASSESSED_SCHEMA_VERSION,
  type LevelAssessedEvent
} from '@feature/assessment';
import { MATERIAL_VIEWED_SCHEMA_VERSION } from '@feature/materials';

import {
  LESSON_COMPLETED_SCHEMA_VERSION,
  type LessonCompletedEvent
} from '../domain/lesson-completed.event';
import {
  SKILL_PRACTICED_SCHEMA_VERSION,
  type SkillPracticedEvent
} from '../domain/skill-practiced.event';
import {
  applyLessonCompleted,
  applyLevelAssessed,
  applyMaterialViewed,
  applySkillPracticed,
  initialProjection,
  normalizedLevel
} from './projections';

function assessedEvent(overrides: Partial<LevelAssessedEvent> = {}): LevelAssessedEvent {
  return {
    schemaVersion: LEVEL_ASSESSED_SCHEMA_VERSION,
    type: 'LevelAssessed',
    assessmentId: 'asm-1',
    studentId: 's1',
    level: 'A2',
    score: 0.42,
    confidence: 0.6,
    skills: {
      listen: { level: 'A2', score: 0.4 },
      speak: { level: 'A1', score: 0.3 },
      read: { level: 'A2', score: 0.5 },
      write: { level: 'A2', score: 0.45 }
    },
    subScores: { grammar: 0.5, vocabulary: 0.4 },
    startedAt: '2026-04-10T09:00:00Z',
    completedAt: '2026-04-10T09:20:00Z',
    locale: 'en',
    ...overrides
  };
}

function lessonEvent(overrides: Partial<LessonCompletedEvent> = {}): LessonCompletedEvent {
  return {
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
    score: 0.55,
    ...overrides
  };
}

describe('projections', () => {
  const base = () => initialProjection('s1', '2026-04-10T00:00:00Z');

  it('captures the CEFR level and per-skill scores from a LevelAssessed event', () => {
    const result = applyLevelAssessed(base(), assessedEvent());
    expect(result.snapshot.level).toBe('A2');
    expect(result.snapshot.skills.listen.score).toBeCloseTo(0.4, 5);
    expect(result.snapshot.subScores.grammar).toBeCloseTo(0.5, 5);
    expect(result.snapshot.streakDays).toBe(1);
    expect(result.timeline[0].kind).toBe('level_assessed');
  });

  it('bumps lessonsCompleted and advances overall score via EMA on lesson completion', () => {
    const first = applyLessonCompleted(base(), lessonEvent({ score: 0.8 }));
    const second = applyLessonCompleted(first, lessonEvent({ lessonId: 'ls-2', score: 0.6, completedAt: '2026-04-12T10:00:00Z' }));
    expect(first.snapshot.lessonsCompleted).toBe(1);
    expect(second.snapshot.lessonsCompleted).toBe(2);
    expect(second.snapshot.overallScore).toBeGreaterThan(0);
    expect(second.snapshot.overallScore).toBeLessThan(0.8);
    expect(second.snapshot.streakDays).toBe(2);
  });

  it('increments materialsViewed and appends a timeline row on MaterialViewed', () => {
    const projection = applyMaterialViewed(base(), {
      schemaVersion: MATERIAL_VIEWED_SCHEMA_VERSION,
      type: 'MaterialViewed',
      materialId: 'mat-1',
      studentId: 's1',
      kind: 'lesson',
      viewedAt: '2026-04-11T14:00:00Z',
      dwellMs: 12_000
    });
    expect(projection.snapshot.materialsViewed).toBe(1);
    expect(projection.timeline[0].kind).toBe('material_viewed');
  });

  it('updates the targeted skill on SkillPracticed and records a delta on the timeline', () => {
    const assessed = applyLevelAssessed(base(), assessedEvent());
    const practice: SkillPracticedEvent = {
      schemaVersion: SKILL_PRACTICED_SCHEMA_VERSION,
      type: 'SkillPracticed',
      studentId: 's1',
      skill: 'speak',
      level: 'A2',
      score: 0.7,
      practicedAt: '2026-04-11T09:00:00Z',
      locale: 'en'
    };
    const result = applySkillPracticed(assessed, practice);
    expect(result.snapshot.skills.speak.score).toBeGreaterThan(0.3);
    expect(result.timeline[0].kind).toBe('skill_practiced');
    expect(result.timeline[0].scoreDelta ?? 0).toBeGreaterThan(0);
  });

  it('records a milestone when the CEFR level advances', () => {
    const start = applyLevelAssessed(base(), assessedEvent({ level: 'A1', score: 0.1 }));
    const jumped = applyLevelAssessed(start, assessedEvent({ assessmentId: 'asm-2', level: 'B1', score: 0.6, completedAt: '2026-04-15T09:00:00Z' }));
    expect(jumped.milestones.length).toBeGreaterThan(0);
    expect(jumped.milestones[jumped.milestones.length - 1].id).toContain('B1');
  });

  it('returns a monotonic normalizedLevel for the CEFR ladder', () => {
    expect(normalizedLevel('A1')).toBe(0);
    expect(normalizedLevel('C2')).toBe(1);
    expect(normalizedLevel('B1')).toBeCloseTo(0.4, 5);
  });
});
