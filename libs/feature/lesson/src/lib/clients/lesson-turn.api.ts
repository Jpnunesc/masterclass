import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '@shared/api';
import type { SupportedLocale } from '@shared/i18n';

export interface LessonTurnChat {
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
}

export interface LessonTurnRequest {
  readonly studentLevel: string;
  readonly topic: string;
  readonly studentUtterance: string;
  readonly history?: readonly LessonTurnChat[];
  readonly targetLanguage?: string;
}

export interface LessonTurnCorrection {
  readonly original: string;
  readonly suggestion: string;
  readonly explanation: string;
}

export interface LessonTurnResult {
  readonly teacherResponse: string;
  readonly corrections: readonly LessonTurnCorrection[];
}

const TARGET_LANGUAGE: Record<SupportedLocale, string> = {
  en: 'English',
  'pt-BR': 'Portuguese (Brazil)'
};

@Injectable({ providedIn: 'root' })
export class LessonTurnApi {
  private readonly api = inject(ApiClient);

  turn(request: LessonTurnRequest): Observable<LessonTurnResult> {
    return this.api.post<LessonTurnResult>('/api/lesson/turn', request);
  }

  turnForLocale(
    request: Omit<LessonTurnRequest, 'targetLanguage'>,
    locale: SupportedLocale
  ): Observable<LessonTurnResult> {
    return this.turn({ ...request, targetLanguage: TARGET_LANGUAGE[locale] ?? TARGET_LANGUAGE.en });
  }
}
