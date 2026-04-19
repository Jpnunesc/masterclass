import { InjectionToken } from '@angular/core';

import type { SupportedLocale } from './locale';

export interface ElevenLabsSpeakRequest {
  readonly text: string;
  readonly locale: SupportedLocale;
}

export interface ElevenLabsSpeakResult {
  /**
   * Object URL (or data URL) for the rendered audio. `null` means the adapter
   * is disabled (muted) or the browser blocked playback; callers should still
   * surface the prompt text visually.
   */
  readonly audioUrl: string | null;
}

export interface ElevenLabsTts {
  speak(request: ElevenLabsSpeakRequest): Promise<ElevenLabsSpeakResult>;
}

export const ELEVENLABS_TTS = new InjectionToken<ElevenLabsTts>(
  'assessment.elevenLabsTts'
);
