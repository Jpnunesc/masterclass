import {
  LEVEL_ASSESSED_SCHEMA_VERSION,
  isLevelAssessedEvent,
  type LevelAssessedEvent
} from './level-assessed.event';

function validEvent(): LevelAssessedEvent {
  return {
    schemaVersion: LEVEL_ASSESSED_SCHEMA_VERSION,
    type: 'LevelAssessed',
    assessmentId: 'assessment-1',
    studentId: 'student-1',
    level: 'B1',
    score: 0.62,
    confidence: 0.78,
    skills: {
      listen: { level: 'B1', score: 0.6 },
      speak: { level: 'A2', score: 0.5 },
      read: { level: 'B2', score: 0.7 },
      write: { level: 'B1', score: 0.6 }
    },
    subScores: { grammar: 0.66, vocabulary: 0.58 },
    startedAt: '2026-04-19T12:00:00.000Z',
    completedAt: '2026-04-19T12:05:00.000Z',
    locale: 'en'
  };
}

describe('LevelAssessed event contract', () => {
  it('accepts a canonical payload', () => {
    expect(isLevelAssessedEvent(validEvent())).toBe(true);
  });

  it('rejects when the schema version is wrong', () => {
    const bad = { ...validEvent(), schemaVersion: 99 };
    expect(isLevelAssessedEvent(bad)).toBe(false);
  });

  it('rejects when the type tag is wrong', () => {
    const bad = { ...validEvent(), type: 'LevelGuessed' };
    expect(isLevelAssessedEvent(bad)).toBe(false);
  });

  it('rejects when the locale is unsupported', () => {
    const bad = { ...validEvent(), locale: 'fr' };
    expect(isLevelAssessedEvent(bad)).toBe(false);
  });

  it('rejects null and non-object values', () => {
    expect(isLevelAssessedEvent(null)).toBe(false);
    expect(isLevelAssessedEvent('LevelAssessed')).toBe(false);
    expect(isLevelAssessedEvent(42)).toBe(false);
  });
});
