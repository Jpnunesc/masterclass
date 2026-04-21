import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClient } from '@shared/api';

import type { SupportedLocale } from './locale';
import type { GroqStt, GroqSttRequest, GroqSttResult } from './groq-stt.client';

interface TranscribeResponse {
  readonly text: string;
  readonly language?: string | null;
}

function languageHint(locale: SupportedLocale): string {
  return locale === 'pt-BR' ? 'pt' : 'en';
}

function fileNameFor(blob: Blob): string {
  if (blob.type.includes('wav')) return 'utterance.wav';
  if (blob.type.includes('ogg')) return 'utterance.ogg';
  return 'utterance.webm';
}

@Injectable({ providedIn: 'root' })
export class GroqHttpStt implements GroqStt {
  private readonly api = inject(ApiClient);

  async transcribe(request: GroqSttRequest): Promise<GroqSttResult> {
    const form = new FormData();
    form.append('file', request.audio, fileNameFor(request.audio));
    form.append('language', languageHint(request.locale));
    try {
      const result = await firstValueFrom(
        this.api.postForm<TranscribeResponse>('/api/stt/transcribe', form)
      );
      return {
        transcript: result.text ?? '',
        durationMs: Math.max(0, request.audio.size / 16)
      };
    } catch {
      return { transcript: '', durationMs: 0 };
    }
  }
}
