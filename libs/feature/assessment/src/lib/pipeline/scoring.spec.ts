import type { AssessmentQuestion } from '../domain/assessment.types';
import {
  computeConfidence,
  deriveSubScores,
  finalize,
  responseWeight,
  skillProfile,
  type ScoredResponse
} from './scoring';

function q(id: string, targetLevel: AssessmentQuestion['targetLevel'], skill: AssessmentQuestion['skill']): AssessmentQuestion {
  return { id, targetLevel, skill, mode: skill === 'speak' ? 'voice' : 'text', promptKey: `k.${id}` };
}

function response(overrides: Partial<ScoredResponse> & { question: AssessmentQuestion }): ScoredResponse {
  return {
    questionId: overrides.question.id,
    transcript: 'the quick brown fox jumps over the lazy dog',
    mode: 'text',
    latencyMs: 1000,
    quality: 0.7,
    ...overrides
  };
}

describe('scoring.responseWeight', () => {
  it('weights higher CEFR levels more than lower ones', () => {
    expect(responseWeight(q('r1', 'A1', 'read'))).toBeLessThan(
      responseWeight(q('r2', 'C2', 'read'))
    );
  });

  it('assigns A1 a non-zero but minimal weight', () => {
    const a1 = responseWeight(q('r', 'A1', 'read'));
    expect(a1).toBeGreaterThan(0);
    expect(a1).toBeLessThanOrEqual(1 / 6);
  });
});

describe('scoring.skillProfile', () => {
  it('returns an A1 placeholder profile for skills with no samples', () => {
    const profile = skillProfile('speak', []);
    expect(profile.sampleCount).toBe(0);
    expect(profile.level).toBe('A1');
    expect(profile.score).toBe(0);
  });

  it('weights higher-level responses more than lower-level ones', () => {
    const responses: ScoredResponse[] = [
      response({ question: q('a', 'A1', 'read'), quality: 1 }),
      response({ question: q('b', 'C1', 'read'), quality: 0.4 })
    ];
    const profile = skillProfile('read', responses);
    expect(profile.sampleCount).toBe(2);
    // Score should lean toward the higher-level result's quality (0.4) because
    // of its weight, not toward 1.0.
    expect(profile.score).toBeLessThan(0.8);
    expect(profile.score).toBeGreaterThan(0.3);
  });
});

describe('scoring.deriveSubScores', () => {
  it('returns zeros when there are no responses', () => {
    expect(deriveSubScores([])).toEqual({ grammar: 0, vocabulary: 0 });
  });

  it('computes grammar as the mean quality', () => {
    const responses: ScoredResponse[] = [
      response({ question: q('a', 'A1', 'read'), quality: 0.2 }),
      response({ question: q('b', 'B1', 'read'), quality: 0.8 })
    ];
    const sub = deriveSubScores(responses);
    expect(sub.grammar).toBeCloseTo(0.5, 3);
    expect(sub.vocabulary).toBeGreaterThan(0);
  });
});

describe('scoring.computeConfidence', () => {
  it('is low with a single response', () => {
    const responses = [response({ question: q('a', 'B1', 'read'), quality: 0.8 })];
    expect(computeConfidence(responses)).toBeLessThan(0.5);
  });

  it('rises with stable qualities and enough samples', () => {
    const stable: ScoredResponse[] = Array.from({ length: 6 }).map((_, i) =>
      response({ question: q(`s${i}`, 'B1', 'read'), quality: 0.7 })
    );
    const noisy: ScoredResponse[] = [0.1, 0.9, 0.2, 0.8, 0.1, 0.95].map((quality, i) =>
      response({ question: q(`n${i}`, 'B1', 'read'), quality })
    );
    expect(computeConfidence(stable)).toBeGreaterThan(computeConfidence(noisy));
  });
});

describe('scoring.finalize', () => {
  it('produces a complete per-skill profile even when some skills are missing', () => {
    const responses = [
      response({ question: q('a', 'B1', 'read'), quality: 0.8 })
    ];
    const result = finalize(responses, '2026-04-19T12:00:00.000Z', '2026-04-19T12:05:00.000Z');
    expect(Object.keys(result.skills).sort()).toEqual(['listen', 'read', 'speak', 'write']);
    expect(result.startedAt).toBe('2026-04-19T12:00:00.000Z');
    expect(result.completedAt).toBe('2026-04-19T12:05:00.000Z');
    expect(result.skills.read.sampleCount).toBe(1);
    expect(result.skills.speak.sampleCount).toBe(0);
  });

  it('returns an A1 result when there are no responses', () => {
    const result = finalize([], '2026-04-19T00:00:00.000Z', '2026-04-19T00:00:00.000Z');
    expect(result.level).toBe('A1');
    expect(result.score).toBe(0);
  });
});
