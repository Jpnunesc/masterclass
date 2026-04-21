import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClient } from '@shared/api';

import type { SupportedLocale } from './locale';
import type {
  ElevenLabsSpeakRequest,
  ElevenLabsSpeakResult,
  ElevenLabsTts
} from './elevenlabs-tts.client';

const DEFAULT_VOICES: Record<SupportedLocale, string> = {
  en: '21m00Tcm4TlvDq8ikWAM',
  'pt-BR': 'AZnzlk1XvdvUeBnXmlld'
};

@Injectable({ providedIn: 'root' })
export class ElevenLabsHttpTts implements ElevenLabsTts {
  private readonly api = inject(ApiClient);

  async speak(request: ElevenLabsSpeakRequest): Promise<ElevenLabsSpeakResult> {
    const voiceId = DEFAULT_VOICES[request.locale] ?? DEFAULT_VOICES.en;
    try {
      const blob = await firstValueFrom(
        this.api.postForBlob('/api/tts/synthesize', { text: request.text, voiceId })
      );
      if (!blob || blob.size === 0) return { audioUrl: null };
      return { audioUrl: URL.createObjectURL(blob) };
    } catch {
      return { audioUrl: null };
    }
  }
}
