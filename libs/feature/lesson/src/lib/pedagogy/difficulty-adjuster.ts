import type { LessonActivity } from '../domain/lesson.types';

export interface LiveSignal {
  /** 0..1 grading quality from the Azure OpenAI judge. */
  readonly quality: number;
  /** Milliseconds between prompt end and response start. */
  readonly hesitationMs: number;
  /** 0..1 pronunciation confidence from the correction loop (speaking only). */
  readonly pronunciationConfidence?: number;
}

export interface DifficultyDecision {
  readonly offset: -1 | 0 | 1;
  readonly reasonKey:
    | 'lesson.adjuster.reason.up'
    | 'lesson.adjuster.reason.steady'
    | 'lesson.adjuster.reason.down';
}

/**
 * Live difficulty adjuster. Runs between activities, never during one.
 *
 * The heuristic blends three signals:
 *   - answer quality (0..1): primary
 *   - hesitation: long pauses suggest cognitive overload
 *   - pronunciation confidence (speaking activities only)
 *
 * It returns a difficulty offset the planner applies to the next activity.
 * Thresholds are tuned so a clearly above-band student steps up within 2
 * activities and a struggling student scaffolds down within 1 — that keeps
 * the session inside its ~15-minute budget without oscillating.
 */
export function adjustDifficulty(
  _activity: LessonActivity,
  signal: LiveSignal
): DifficultyDecision {
  const ease = blendedEase(signal);
  if (ease >= 0.75) return { offset: 1, reasonKey: 'lesson.adjuster.reason.up' };
  if (ease <= 0.35) return { offset: -1, reasonKey: 'lesson.adjuster.reason.down' };
  return { offset: 0, reasonKey: 'lesson.adjuster.reason.steady' };
}

export function blendedEase(signal: LiveSignal): number {
  const quality = clamp01(signal.quality);
  const hesitationPenalty = Math.min(1, signal.hesitationMs / 8000);
  const pron = signal.pronunciationConfidence ?? 1;
  return clamp01(quality * 0.6 + (1 - hesitationPenalty) * 0.2 + clamp01(pron) * 0.2);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
