import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '@shared/api';

import type { SupportedLocale } from './locale';

export interface ChatTurn {
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
}

export interface EvaluateRequest {
  readonly conversation: readonly ChatTurn[];
  readonly targetLanguage?: string;
}

export interface AssessmentEvaluation {
  readonly level: string;
  readonly rationale: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
}

function targetFor(locale: SupportedLocale): string {
  return locale === 'pt-BR' ? 'Portuguese (Brazil)' : 'English';
}

@Injectable({ providedIn: 'root' })
export class AssessmentApi {
  private readonly api = inject(ApiClient);

  evaluate(request: EvaluateRequest): Observable<AssessmentEvaluation> {
    return this.api.post<AssessmentEvaluation>('/api/assessment/evaluate', request);
  }

  evaluateForLocale(
    conversation: readonly ChatTurn[],
    locale: SupportedLocale
  ): Observable<AssessmentEvaluation> {
    return this.evaluate({ conversation, targetLanguage: targetFor(locale) });
  }
}
