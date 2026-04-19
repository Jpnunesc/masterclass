import { InjectionToken } from '@angular/core';

import type { AssessmentQuestion } from '../domain/assessment.types';
import type { SupportedLocale } from '../clients/locale';

export interface AzureOpenAiJudgeInput {
  readonly question: AssessmentQuestion;
  readonly transcript: string;
  readonly locale: SupportedLocale;
}

export interface AzureOpenAiJudgeResult {
  /** 0..1 response quality as estimated by the Azure OpenAI judge. */
  readonly quality: number;
  /** Optional rubric subscores (0..1) for grammar/vocabulary. */
  readonly grammar?: number;
  readonly vocabulary?: number;
  /** Optional short feedback phrase to show after the response. */
  readonly feedbackKey?: string;
}

/**
 * Contract implemented by the Azure OpenAI adapter. The production adapter
 * lives in the .NET API (sibling repo); the Angular side only consumes the
 * HTTP/SSE surface through a thin client. Abstracted via an InjectionToken so
 * tests can substitute a deterministic stub.
 */
export interface AzureOpenAiJudge {
  grade(input: AzureOpenAiJudgeInput): Promise<AzureOpenAiJudgeResult>;
}

export const AZURE_OPENAI_JUDGE = new InjectionToken<AzureOpenAiJudge>(
  'assessment.azureOpenAiJudge'
);
