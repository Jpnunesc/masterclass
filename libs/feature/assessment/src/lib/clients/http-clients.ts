import { Provider } from '@angular/core';

import { AZURE_OPENAI_JUDGE } from './azure-openai.client';
import { ELEVENLABS_TTS } from './elevenlabs-tts.client';
import { GROQ_STT } from './groq-stt.client';
import { ElevenLabsHttpTts } from './elevenlabs-tts.http';
import { GroqHttpStt } from './groq-stt.http';
import { StubAzureOpenAiJudge } from './stub-clients';

/**
 * Provides TTS + STT via the MasterClass .NET API. The judge stays on the
 * deterministic stub until the backend exposes a per-turn grade endpoint —
 * /api/assessment/evaluate today only supports whole-conversation scoring,
 * which the adaptive pipeline consumes separately at finalize time.
 */
export function provideAssessmentHttpClients(): Provider[] {
  return [
    { provide: ELEVENLABS_TTS, useClass: ElevenLabsHttpTts },
    { provide: GROQ_STT, useClass: GroqHttpStt },
    { provide: AZURE_OPENAI_JUDGE, useClass: StubAzureOpenAiJudge }
  ];
}
