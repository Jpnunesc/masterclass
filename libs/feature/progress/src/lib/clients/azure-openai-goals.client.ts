import { InjectionToken } from '@angular/core';

import type { SupportedLocale } from '@shared/i18n';

import type {
  Goal,
  StudentProgressSnapshot,
  TimelineEvent
} from '../domain/progress.types';

export interface SuggestGoalsInput {
  readonly snapshot: StudentProgressSnapshot;
  readonly recentTimeline: readonly TimelineEvent[];
  readonly locale: SupportedLocale;
  readonly limit: number;
}

/**
 * Thin contract the Angular side consumes for AI-suggested goals. Production
 * wires the Azure OpenAI HTTP adapter from the .NET API; tests and offline
 * builds use the deterministic stub from `stub-goals.client.ts`.
 */
export interface AzureOpenAiGoals {
  suggest(input: SuggestGoalsInput): Promise<readonly Goal[]>;
}

export const AZURE_OPENAI_GOALS = new InjectionToken<AzureOpenAiGoals>(
  'progress.azureOpenAiGoals'
);
