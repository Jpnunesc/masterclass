import type {
  AssessmentQuestion,
  AssessmentResult,
  AssessmentSkill,
  QuestionResponse
} from '../domain/assessment.types';
import { CEFR_LEVELS, CEFR_ORDINALS, type CefrLevel } from '../domain/cefr';
import { finalize, type ScoredResponse } from './scoring';
import type { QuestionBank } from './question-bank';

export interface AdaptivePipelineConfig {
  readonly bank: QuestionBank;
  readonly maxQuestions: number;
  readonly minQuestions: number;
  readonly startingLevel: CefrLevel;
  /**
   * Quality threshold (0..1) that counts as "student handled this level".
   * Above = step up; below = step down. Tuned so a typical student converges
   * in ~6 questions (inside the 8-minute acceptance budget).
   */
  readonly upThreshold: number;
  readonly downThreshold: number;
}

export const DEFAULT_PIPELINE_CONFIG: Omit<AdaptivePipelineConfig, 'bank'> = {
  maxQuestions: 8,
  minQuestions: 4,
  startingLevel: 'B1',
  upThreshold: 0.7,
  downThreshold: 0.4
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

interface MutablePipelineState {
  currentLevel: CefrLevel;
  askedIds: Set<string>;
  skillCoverage: Set<AssessmentSkill>;
  responses: ScoredResponse[];
}

export interface Pipeline {
  nextQuestion(): AssessmentQuestion | null;
  recordResponse(response: QuestionResponse): void;
  isComplete(): boolean;
  finalize(startedAt: string, completedAt: string): AssessmentResult;
  snapshot(): {
    readonly level: CefrLevel;
    readonly answered: number;
    readonly total: number;
    readonly responses: readonly QuestionResponse[];
  };
}

const SKILL_ORDER: readonly AssessmentSkill[] = ['listen', 'read', 'write', 'speak'];

export function createAdaptivePipeline(config: AdaptivePipelineConfig): Pipeline {
  const state: MutablePipelineState = {
    currentLevel: config.startingLevel,
    askedIds: new Set(),
    skillCoverage: new Set(),
    responses: []
  };

  function pickSkill(): AssessmentSkill {
    const uncovered = SKILL_ORDER.find((s) => !state.skillCoverage.has(s));
    if (uncovered) return uncovered;
    const index = state.responses.length % SKILL_ORDER.length;
    return SKILL_ORDER[index];
  }

  function pickAtLevel(level: CefrLevel, skill: AssessmentSkill): AssessmentQuestion | null {
    const pool = config.bank.questionsFor(level);
    const unasked = pool.filter((q) => !state.askedIds.has(q.id));
    const bySkill = unasked.find((q) => q.skill === skill);
    return bySkill ?? unasked[0] ?? null;
  }

  function nextQuestion(): AssessmentQuestion | null {
    if (isComplete()) return null;
    const skill = pickSkill();
    const exact = pickAtLevel(state.currentLevel, skill);
    if (exact) return exact;
    for (const l of neighboursOf(state.currentLevel)) {
      const q = pickAtLevel(l, skill);
      if (q) return q;
    }
    return null;
  }

  function recordResponse(response: QuestionResponse): void {
    const q = config.bank.question(response.questionId);
    if (!q) throw new Error(`Unknown questionId: ${response.questionId}`);
    state.askedIds.add(q.id);
    state.skillCoverage.add(q.skill);
    const entry: Mutable<ScoredResponse> = { ...response, question: q };
    state.responses.push(entry);
    state.currentLevel = stepLevel(state.currentLevel, response.quality, config);
  }

  function isComplete(): boolean {
    if (state.responses.length >= config.maxQuestions) return true;
    if (state.responses.length < config.minQuestions) return false;
    const covered = SKILL_ORDER.every((s) => state.skillCoverage.has(s));
    if (!covered) return false;
    return hasConverged(state.responses);
  }

  return {
    nextQuestion,
    recordResponse,
    isComplete,
    finalize(startedAt, completedAt) {
      return finalize(state.responses, startedAt, completedAt);
    },
    snapshot() {
      return {
        level: state.currentLevel,
        answered: state.responses.length,
        total: config.maxQuestions,
        responses: state.responses.map(toResponsePayload)
      };
    }
  };
}

function stepLevel(
  current: CefrLevel,
  quality: number,
  config: AdaptivePipelineConfig
): CefrLevel {
  const ord = CEFR_ORDINALS[current];
  if (quality >= config.upThreshold) {
    return CEFR_LEVELS[Math.min(CEFR_LEVELS.length - 1, ord + 1)];
  }
  if (quality <= config.downThreshold) {
    return CEFR_LEVELS[Math.max(0, ord - 1)];
  }
  return current;
}

function neighboursOf(level: CefrLevel): readonly CefrLevel[] {
  const ord = CEFR_ORDINALS[level];
  const offsets = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
  return offsets
    .map((o) => ord + o)
    .filter((o) => o >= 0 && o < CEFR_LEVELS.length)
    .map((o) => CEFR_LEVELS[o]);
}

function toResponsePayload(r: ScoredResponse): QuestionResponse {
  return {
    questionId: r.questionId,
    transcript: r.transcript,
    mode: r.mode,
    latencyMs: r.latencyMs,
    quality: r.quality
  };
}

function hasConverged(responses: readonly ScoredResponse[]): boolean {
  if (responses.length < 4) return false;
  const lastThree = responses.slice(-3);
  const levels = lastThree.map((r) => CEFR_ORDINALS[r.question.targetLevel]);
  const span = Math.max(...levels) - Math.min(...levels);
  return span <= 1;
}
