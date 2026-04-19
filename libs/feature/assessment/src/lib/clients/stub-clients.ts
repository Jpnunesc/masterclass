import { Provider } from '@angular/core';

import type { AssessmentQuestion } from '../domain/assessment.types';
import { CEFR_LEVELS, CEFR_ORDINALS } from '../domain/cefr';
import { AZURE_OPENAI_JUDGE, type AzureOpenAiJudge, type AzureOpenAiJudgeInput, type AzureOpenAiJudgeResult } from './azure-openai.client';
import { ELEVENLABS_TTS, type ElevenLabsSpeakResult, type ElevenLabsTts } from './elevenlabs-tts.client';
import { GROQ_STT, type GroqStt, type GroqSttRequest, type GroqSttResult } from './groq-stt.client';

/**
 * Deterministic Azure OpenAI judge used during offline dev + unit tests. The
 * grading heuristic rewards:
 *   - longer responses (up to ~40 words) as a weak proxy for fluency
 *   - answers that contain any expected keyword from the question bank
 *   - responses at or near the target CEFR level
 *
 * Production swaps this out for the real Azure OpenAI adapter via DI.
 */
export class StubAzureOpenAiJudge implements AzureOpenAiJudge {
  async grade(input: AzureOpenAiJudgeInput): Promise<AzureOpenAiJudgeResult> {
    const base = lengthSignal(input.transcript);
    const keyword = keywordSignal(input.question, input.transcript, input.locale);
    const levelBias = levelBiasSignal(input.question);
    const quality = clamp01(base * 0.5 + keyword * 0.4 + levelBias * 0.1);
    return {
      quality,
      grammar: quality,
      vocabulary: clamp01(lexicalDiversity(input.transcript))
    };
  }
}

export class StubGroqStt implements GroqStt {
  async transcribe(request: GroqSttRequest): Promise<GroqSttResult> {
    return {
      transcript: '',
      durationMs: Math.max(0, request.audio.size / 16)
    };
  }
}

export class StubElevenLabsTts implements ElevenLabsTts {
  async speak(): Promise<ElevenLabsSpeakResult> {
    return { audioUrl: null };
  }
}

/**
 * Convenience provider that wires the three stubs into DI. Apps that have a
 * real API should provide the live clients instead.
 */
export function provideAssessmentStubs(): Provider[] {
  return [
    { provide: AZURE_OPENAI_JUDGE, useClass: StubAzureOpenAiJudge },
    { provide: GROQ_STT, useClass: StubGroqStt },
    { provide: ELEVENLABS_TTS, useClass: StubElevenLabsTts }
  ];
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function lengthSignal(transcript: string): number {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  return clamp01(words / 40);
}

function lexicalDiversity(transcript: string): number {
  const words = transcript
    .toLocaleLowerCase()
    .replace(/[^\p{L}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 0;
  return new Set(words).size / words.length;
}

function keywordSignal(
  q: AssessmentQuestion,
  transcript: string,
  locale: string
): number {
  const expectedForLocale = q.expected?.[locale];
  if (!expectedForLocale || expectedForLocale.length === 0) return 0.5;
  const lower = transcript.toLocaleLowerCase();
  const hits = expectedForLocale.filter((kw) =>
    lower.includes(kw.toLocaleLowerCase())
  ).length;
  return clamp01(hits / expectedForLocale.length);
}

function levelBiasSignal(q: AssessmentQuestion): number {
  const ord = CEFR_ORDINALS[q.targetLevel];
  return 1 - ord / (CEFR_LEVELS.length - 1);
}
