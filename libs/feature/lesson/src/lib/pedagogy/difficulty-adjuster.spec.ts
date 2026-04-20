import { adjustDifficulty, blendedEase } from './difficulty-adjuster';
import type { LessonActivity } from '../domain/lesson.types';

function activity(overrides: Partial<LessonActivity> = {}): LessonActivity {
  return {
    id: 'a',
    kind: 'speaking',
    targetSkill: 'speak',
    cefrLevel: 'B1',
    promptKey: 'lesson.curriculum.b1.work.speaking',
    objectiveKey: 'lesson.activity.objective.speaking',
    estSeconds: 90,
    difficultyOffset: 0,
    ...overrides
  };
}

describe('adjustDifficulty', () => {
  it('steps up when the student is clearly above level', () => {
    const decision = adjustDifficulty(activity(), {
      quality: 0.9,
      hesitationMs: 400,
      pronunciationConfidence: 0.95
    });
    expect(decision.offset).toBe(1);
    expect(decision.reasonKey).toBe('lesson.adjuster.reason.up');
  });

  it('steps down when the student is clearly struggling', () => {
    const decision = adjustDifficulty(activity(), {
      quality: 0.2,
      hesitationMs: 8000,
      pronunciationConfidence: 0.3
    });
    expect(decision.offset).toBe(-1);
    expect(decision.reasonKey).toBe('lesson.adjuster.reason.down');
  });

  it('holds steady in the in-between band', () => {
    const decision = adjustDifficulty(activity(), {
      quality: 0.55,
      hesitationMs: 1500
    });
    expect(decision.offset).toBe(0);
  });
});

describe('blendedEase', () => {
  it('returns a value in [0,1]', () => {
    expect(blendedEase({ quality: 0.5, hesitationMs: 0 })).toBeGreaterThan(0);
    expect(blendedEase({ quality: 1, hesitationMs: 0 })).toBeLessThanOrEqual(1);
    expect(blendedEase({ quality: -0.5, hesitationMs: 20000 })).toBeGreaterThanOrEqual(0);
  });
});
