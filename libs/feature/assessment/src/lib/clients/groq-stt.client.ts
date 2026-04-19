import { InjectionToken } from '@angular/core';

import type { SupportedLocale } from './locale';

export interface GroqSttRequest {
  readonly audio: Blob;
  readonly locale: SupportedLocale;
}

export interface GroqSttResult {
  readonly transcript: string;
  readonly durationMs: number;
}

/**
 * Low-latency speech-to-text adapter. Concrete implementation posts captured
 * audio to the .NET API which proxies Groq; the Angular side depends only on
 * this interface.
 */
export interface GroqStt {
  transcribe(request: GroqSttRequest): Promise<GroqSttResult>;
}

export const GROQ_STT = new InjectionToken<GroqStt>('assessment.groqStt');
