import { InjectionToken } from '@angular/core';

import type { SupportedLocale } from '@shared/i18n';

import type { PronunciationEvaluation } from '../correction/correction.types';

export interface PronunciationJudgeInput {
  readonly transcript: string;
  readonly targetSentence: string;
  readonly locale: SupportedLocale;
  readonly activityId: string;
}

/**
 * Pronunciation judge adapter. Production points at the .NET API which proxies
 * Azure OpenAI with the pedagogy prompt; Angular depends only on this contract
 * so DI can substitute a deterministic stub in tests and offline dev.
 */
export interface PronunciationJudge {
  evaluate(input: PronunciationJudgeInput): Promise<PronunciationEvaluation>;
}

export const PRONUNCIATION_JUDGE = new InjectionToken<PronunciationJudge>(
  'lesson.pronunciationJudge'
);
