import type { SupportedLocale } from '@shared/i18n';

export interface PronunciationEvaluation {
  /** 0..1 overall pronunciation confidence. */
  readonly confidence: number;
  /** Words flagged for correction with IPA + suggested fix key. */
  readonly flaggedWords: readonly FlaggedWord[];
  /** Short feedback phrase to speak back via ElevenLabs TTS. */
  readonly feedbackKey: string;
  /** Full Azure OpenAI rationale (may be empty in the stub adapter). */
  readonly rationale?: string;
}

export interface FlaggedWord {
  readonly word: string;
  readonly ipa?: string;
  readonly hintKey: string;
}

export interface PronunciationLoopResult {
  readonly transcript: string;
  readonly evaluation: PronunciationEvaluation;
  readonly audioFeedbackUrl: string | null;
  readonly timings: PronunciationLoopTimings;
}

export interface PronunciationLoopTimings {
  readonly sttMs: number;
  readonly judgeMs: number;
  readonly ttsMs: number;
  readonly totalMs: number;
}

export interface PronunciationLoopRequest {
  readonly audio: Blob;
  readonly targetSentence: string;
  readonly locale: SupportedLocale;
  readonly activityId: string;
}
