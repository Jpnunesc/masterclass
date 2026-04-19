import { CEFR_ORDINALS } from '../domain/cefr';
import type { QuestionResponse } from '../domain/assessment.types';
import { DEFAULT_PIPELINE_CONFIG, createAdaptivePipeline } from './pipeline';
import { createSeedQuestionBank } from './question-bank';

function respondTo(questionId: string, quality: number): QuestionResponse {
  return {
    questionId,
    transcript: 'sample response',
    mode: 'text',
    latencyMs: 1200,
    quality
  };
}

describe('adaptive pipeline', () => {
  it('starts at the configured level and asks a question there', () => {
    const pipeline = createAdaptivePipeline({
      bank: createSeedQuestionBank(),
      ...DEFAULT_PIPELINE_CONFIG
    });
    const first = pipeline.nextQuestion();
    expect(first).not.toBeNull();
    expect(first!.targetLevel).toBe(DEFAULT_PIPELINE_CONFIG.startingLevel);
  });

  it('steps up on high-quality answers and stays within 8 questions', () => {
    const pipeline = createAdaptivePipeline({
      bank: createSeedQuestionBank(),
      ...DEFAULT_PIPELINE_CONFIG
    });
    let asked = 0;
    while (!pipeline.isComplete()) {
      const q = pipeline.nextQuestion();
      if (!q) break;
      pipeline.recordResponse(respondTo(q.id, 0.95));
      asked += 1;
      if (asked > DEFAULT_PIPELINE_CONFIG.maxQuestions) {
        throw new Error('pipeline overran max questions');
      }
    }
    expect(asked).toBeLessThanOrEqual(DEFAULT_PIPELINE_CONFIG.maxQuestions);
    const result = pipeline.finalize('2026-04-19T00:00:00Z', '2026-04-19T00:05:00Z');
    expect(['B2', 'C1', 'C2']).toContain(result.level);
  });

  it('steps down on low-quality answers and lands near A1/A2', () => {
    const pipeline = createAdaptivePipeline({
      bank: createSeedQuestionBank(),
      ...DEFAULT_PIPELINE_CONFIG
    });
    while (!pipeline.isComplete()) {
      const q = pipeline.nextQuestion();
      if (!q) break;
      pipeline.recordResponse(respondTo(q.id, 0.05));
    }
    const result = pipeline.finalize('2026-04-19T00:00:00Z', '2026-04-19T00:05:00Z');
    expect(CEFR_ORDINALS[result.level]).toBeLessThanOrEqual(CEFR_ORDINALS.A2);
  });

  it('covers every skill at least once for a typical run', () => {
    const pipeline = createAdaptivePipeline({
      bank: createSeedQuestionBank(),
      ...DEFAULT_PIPELINE_CONFIG
    });
    while (!pipeline.isComplete()) {
      const q = pipeline.nextQuestion();
      if (!q) break;
      pipeline.recordResponse(respondTo(q.id, 0.6));
    }
    const result = pipeline.finalize('s', 'c');
    for (const skill of ['listen', 'speak', 'read', 'write'] as const) {
      expect(result.skills[skill].sampleCount).toBeGreaterThan(0);
    }
  });

  it('refuses to record unknown question ids', () => {
    const pipeline = createAdaptivePipeline({
      bank: createSeedQuestionBank(),
      ...DEFAULT_PIPELINE_CONFIG
    });
    expect(() => pipeline.recordResponse(respondTo('does-not-exist', 0.5))).toThrow();
  });
});
