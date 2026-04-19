import type {
  AssessmentQuestion,
  AssessmentResult,
  AssessmentSkill,
  AssessmentSubScore,
  QuestionResponse,
  SkillProfile
} from '../domain/assessment.types';
import { CEFR_LEVELS, CEFR_ORDINALS, levelFromOrdinal, levelFromScore, type CefrLevel } from '../domain/cefr';

const SKILLS: readonly AssessmentSkill[] = ['listen', 'speak', 'read', 'write'];
const SUB_SCORES: readonly AssessmentSubScore[] = ['grammar', 'vocabulary'];

export interface ScoredResponse extends QuestionResponse {
  readonly question: AssessmentQuestion;
}

/**
 * Weight a single response toward an overall 0..1 proficiency score. A correct
 * answer at a higher CEFR level counts more than at a lower level, so a
 * student who only answers A1 questions correctly cannot ceiling the score.
 */
export function responseWeight(q: AssessmentQuestion): number {
  return (CEFR_ORDINALS[q.targetLevel] + 1) / CEFR_LEVELS.length;
}

/**
 * Per-skill profile computed from the subset of responses tagged with that
 * skill. Skills with no samples get a conservative A1 placeholder so the
 * result schema is always complete for F2.
 */
export function skillProfile(
  skill: AssessmentSkill,
  responses: readonly ScoredResponse[]
): SkillProfile {
  const relevant = responses.filter((r) => r.question.skill === skill);
  if (relevant.length === 0) {
    return { level: 'A1', score: 0, sampleCount: 0 };
  }
  const weighted = relevant.reduce(
    (acc, r) => {
      const w = responseWeight(r.question);
      return {
        num: acc.num + r.quality * w,
        den: acc.den + w
      };
    },
    { num: 0, den: 0 }
  );
  const score = weighted.den === 0 ? 0 : weighted.num / weighted.den;
  return {
    level: levelFromScore(score),
    score: round3(score),
    sampleCount: relevant.length
  };
}

/**
 * Grammar and vocabulary sub-scores. Without per-response grammar/vocab
 * signals from Azure OpenAI, we derive deterministic proxies from quality and
 * answer length so tests and the stub adapter stay coherent; the production
 * LLM adapter overrides these via `scoreResponses` on the returned payload.
 */
export function deriveSubScores(
  responses: readonly ScoredResponse[]
): Readonly<Record<AssessmentSubScore, number>> {
  if (responses.length === 0) {
    return { grammar: 0, vocabulary: 0 };
  }
  const grammar = mean(responses.map((r) => r.quality));
  const lexicalDiversity = Math.min(
    1,
    mean(responses.map((r) => lexicalDiversityScore(r.transcript)))
  );
  return {
    grammar: round3(grammar),
    vocabulary: round3(lexicalDiversity)
  };
}

function lexicalDiversityScore(transcript: string): number {
  const words = transcript
    .toLocaleLowerCase()
    .replace(/[^\p{L}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 0;
  const unique = new Set(words).size;
  return unique / words.length;
}

/**
 * Confidence is a 0..1 score derived from the stability of the response
 * stream: low variance across responses + enough samples = high confidence.
 */
export function computeConfidence(responses: readonly ScoredResponse[]): number {
  if (responses.length < 2) return 0.3;
  const qualities = responses.map((r) => r.quality);
  const avg = mean(qualities);
  const variance =
    qualities.reduce((acc, q) => acc + (q - avg) * (q - avg), 0) / qualities.length;
  const stability = Math.max(0, 1 - Math.sqrt(variance) * 2);
  const sampleBonus = Math.min(1, responses.length / 6);
  return round3(stability * 0.7 + sampleBonus * 0.3);
}

export function finalize(
  responses: readonly ScoredResponse[],
  startedAt: string,
  completedAt: string
): AssessmentResult {
  const overall = overallScore(responses);
  const skills = Object.fromEntries(
    SKILLS.map((s) => [s, skillProfile(s, responses)])
  ) as Record<AssessmentSkill, SkillProfile>;
  const subScores = deriveSubScores(responses);
  const skillOrdinalAvg =
    mean(SKILLS.map((s) => CEFR_ORDINALS[skills[s].level])) || 0;
  const level =
    responses.length === 0
      ? 'A1'
      : blendLevels(levelFromScore(overall), levelFromOrdinal(skillOrdinalAvg));
  return {
    level,
    score: round3(overall),
    confidence: computeConfidence(responses),
    skills,
    subScores,
    responses: responses.map(stripQuestion),
    startedAt,
    completedAt
  };
}

function overallScore(responses: readonly ScoredResponse[]): number {
  if (responses.length === 0) return 0;
  const weighted = responses.reduce(
    (acc, r) => {
      const w = responseWeight(r.question);
      return { num: acc.num + r.quality * w, den: acc.den + w };
    },
    { num: 0, den: 0 }
  );
  return weighted.den === 0 ? 0 : weighted.num / weighted.den;
}

function blendLevels(a: CefrLevel, b: CefrLevel): CefrLevel {
  const ordinal = (CEFR_ORDINALS[a] + CEFR_ORDINALS[b]) / 2;
  return levelFromOrdinal(ordinal);
}

function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

function stripQuestion(r: ScoredResponse): QuestionResponse {
  return {
    questionId: r.questionId,
    transcript: r.transcript,
    mode: r.mode,
    latencyMs: r.latencyMs,
    quality: r.quality
  };
}

export const _SCORING_INTERNALS = { SKILLS, SUB_SCORES };
