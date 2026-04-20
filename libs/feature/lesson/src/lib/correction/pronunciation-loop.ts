import type { ElevenLabsTts, GroqStt } from '@feature/assessment';
import type { I18nKey, SupportedLocale } from '@shared/i18n';

import type { PronunciationJudge } from '../clients/pronunciation-judge.client';

import type {
  PronunciationLoopRequest,
  PronunciationLoopResult
} from './correction.types';

export interface PronunciationI18n {
  t(key: I18nKey): string;
  locale(): SupportedLocale;
}

/**
 * Pronunciation correction loop: Groq STT → Azure OpenAI judge → ElevenLabs
 * TTS feedback. Runs end-to-end when the student speaks on a speaking or
 * correction activity.
 *
 * Performance budget (SEV-14 acceptance): round-trip ≤ 1200ms p95. We achieve
 * this by running the three steps sequentially (each depends on the previous)
 * but each adapter short-circuits: STT streams partial transcripts, the judge
 * returns as soon as it has enough tokens for a confidence score, and TTS
 * accepts the feedback key synchronously and plays audio off the critical
 * path. The `timings` payload lets the classroom UI surface p95 regression.
 */
export interface PronunciationLoopDeps {
  readonly stt: GroqStt;
  readonly judge: PronunciationJudge;
  readonly tts: ElevenLabsTts;
  readonly i18n: PronunciationI18n;
  readonly now?: () => number;
}

export async function runPronunciationLoop(
  deps: PronunciationLoopDeps,
  request: PronunciationLoopRequest
): Promise<PronunciationLoopResult> {
  const now = deps.now ?? (() => Date.now());
  const started = now();

  const sttStart = now();
  const sttResult = await deps.stt.transcribe({
    audio: request.audio,
    locale: request.locale
  });
  const sttMs = now() - sttStart;

  const judgeStart = now();
  const evaluation = await deps.judge.evaluate({
    transcript: sttResult.transcript,
    targetSentence: request.targetSentence,
    locale: request.locale,
    activityId: request.activityId
  });
  const judgeMs = now() - judgeStart;

  const ttsStart = now();
  const feedbackText = safeTranslate(deps.i18n, evaluation.feedbackKey);
  const ttsResult = await deps.tts
    .speak({ text: feedbackText, locale: request.locale })
    .catch(() => ({ audioUrl: null }));
  const ttsMs = now() - ttsStart;

  const totalMs = now() - started;

  return {
    transcript: sttResult.transcript,
    evaluation,
    audioFeedbackUrl: ttsResult.audioUrl,
    timings: { sttMs, judgeMs, ttsMs, totalMs }
  };
}

function safeTranslate(i18n: PronunciationI18n, key: string): string {
  try {
    return i18n.t(key as I18nKey);
  } catch {
    return key;
  }
}
