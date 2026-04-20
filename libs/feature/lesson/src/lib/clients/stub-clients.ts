import { Provider } from '@angular/core';

import type { PronunciationEvaluation } from '../correction/correction.types';
import {
  PRONUNCIATION_JUDGE,
  type PronunciationJudge,
  type PronunciationJudgeInput
} from './pronunciation-judge.client';

/**
 * Deterministic pronunciation judge for offline dev + unit tests. The heuristic
 * compares the spoken transcript against the target sentence:
 *   - identical (case-insensitive, ignoring punctuation) -> confidence 0.95
 *   - matches 80%+ of target tokens -> 0.7, flags the mismatched words
 *   - otherwise -> 0.4 and flags the first 3 mismatched words
 *
 * Production swaps this out via DI.
 */
export class StubPronunciationJudge implements PronunciationJudge {
  async evaluate(input: PronunciationJudgeInput): Promise<PronunciationEvaluation> {
    const target = tokens(input.targetSentence);
    const spoken = tokens(input.transcript);
    if (target.length === 0) {
      return {
        confidence: 0.5,
        flaggedWords: [],
        feedbackKey: 'lesson.correction.feedback.unknown'
      };
    }
    const targetSet = new Set(target);
    const spokenSet = new Set(spoken);
    const overlap = target.filter((t) => spokenSet.has(t)).length;
    const ratio = overlap / target.length;
    if (ratio >= 0.98) {
      return {
        confidence: 0.95,
        flaggedWords: [],
        feedbackKey: 'lesson.correction.feedback.perfect'
      };
    }
    if (ratio >= 0.8) {
      const missing = target.filter((t) => !spokenSet.has(t)).slice(0, 2);
      return {
        confidence: 0.7,
        flaggedWords: missing.map((w) => ({
          word: w,
          hintKey: 'lesson.correction.hint.listen_again'
        })),
        feedbackKey: 'lesson.correction.feedback.close'
      };
    }
    const missing = target.filter((t) => !spokenSet.has(t)).slice(0, 3);
    const extra = spoken.filter((s) => !targetSet.has(s)).slice(0, 1);
    const flagged = [...missing, ...extra];
    return {
      confidence: 0.4,
      flaggedWords: flagged.map((w) => ({
        word: w,
        hintKey: 'lesson.correction.hint.try_slower'
      })),
      feedbackKey: 'lesson.correction.feedback.try_again'
    };
  }
}

export function provideLessonStubs(): Provider[] {
  return [{ provide: PRONUNCIATION_JUDGE, useClass: StubPronunciationJudge }];
}

function tokens(sentence: string): string[] {
  return sentence
    .toLocaleLowerCase()
    .replace(/[^\p{L}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
