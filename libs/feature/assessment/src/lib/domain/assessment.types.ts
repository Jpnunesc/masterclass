import type { CefrLevel } from './cefr';

export type AssessmentSkill = 'listen' | 'speak' | 'read' | 'write';
export type AssessmentSubScore = 'grammar' | 'vocabulary';

export type InputMode = 'text' | 'voice';

export type QuestionId = string;

export interface AssessmentQuestion {
  readonly id: QuestionId;
  readonly targetLevel: CefrLevel;
  readonly skill: AssessmentSkill;
  readonly mode: InputMode;
  /**
   * i18n key rendered by the teacher avatar. The catalog (EN/PT) owns the
   * actual prompt text so questions remain locale-agnostic here.
   */
  readonly promptKey: string;
  /**
   * Expected answers keyed by locale. Used only for deterministic scoring in
   * the stub LLM adapter; the production adapter grades via Azure OpenAI.
   */
  readonly expected?: Readonly<Record<string, readonly string[]>>;
}

export interface QuestionResponse {
  readonly questionId: QuestionId;
  readonly transcript: string;
  readonly mode: InputMode;
  /**
   * Latency in milliseconds between prompt delivery and response submission.
   * Used as a minor signal for speaking fluency.
   */
  readonly latencyMs: number;
  /**
   * LLM-rated quality in 0..1 from the Azure OpenAI branching judge. The stub
   * adapter fills this deterministically so tests don't hit the network.
   */
  readonly quality: number;
}

export interface SkillProfile {
  readonly level: CefrLevel;
  readonly score: number;
  readonly sampleCount: number;
}

export interface AssessmentResult {
  readonly level: CefrLevel;
  readonly score: number;
  readonly confidence: number;
  readonly skills: Readonly<Record<AssessmentSkill, SkillProfile>>;
  readonly subScores: Readonly<Record<AssessmentSubScore, number>>;
  readonly responses: readonly QuestionResponse[];
  readonly startedAt: string;
  readonly completedAt: string;
}

export type AssessmentPhase =
  | 'idle'
  | 'preparing'
  | 'listening'
  | 'thinking'
  | 'completed'
  | 'error';

export interface AssessmentState {
  readonly phase: AssessmentPhase;
  readonly currentQuestion: AssessmentQuestion | null;
  readonly progress: { readonly answered: number; readonly total: number };
  readonly responses: readonly QuestionResponse[];
  readonly result: AssessmentResult | null;
  readonly error: string | null;
}

export const INITIAL_ASSESSMENT_STATE: AssessmentState = {
  phase: 'idle',
  currentQuestion: null,
  progress: { answered: 0, total: 0 },
  responses: [],
  result: null,
  error: null
};
