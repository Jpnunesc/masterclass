import type {
  AppendCorrectionInput,
  AppendPronunciationInput,
  AppendTurnInput,
  CompleteSessionInput,
  LessonSession,
  LessonSessionId,
  PronunciationDelta,
  SessionCorrection,
  StartSessionInput,
  TranscriptTurn
} from '../domain/lesson-session.types';

interface ActiveDraft {
  readonly id: LessonSessionId;
  readonly input: StartSessionInput;
  turns: TranscriptTurn[];
  corrections: SessionCorrection[];
  pronunciation: PronunciationDelta[];
  turnCounter: number;
  correctionCounter: number;
}

/**
 * Accumulates live-session fragments (turns, corrections, pronunciation
 * deltas) until the session completes. Separating draft state from the stored
 * `LessonSession` means a disconnect mid-session does not corrupt prior
 * history — the service only calls `finalize` on explicit completion.
 */
export class SessionRecorder {
  private readonly drafts = new Map<LessonSessionId, ActiveDraft>();

  start(id: LessonSessionId, input: StartSessionInput): void {
    this.drafts.set(id, {
      id,
      input,
      turns: [],
      corrections: [],
      pronunciation: [],
      turnCounter: 0,
      correctionCounter: 0
    });
  }

  appendTurn(input: AppendTurnInput): TranscriptTurn | null {
    const draft = this.drafts.get(input.sessionId);
    if (!draft) return null;
    draft.turnCounter += 1;
    const turn: TranscriptTurn = {
      id: `${draft.id}-t-${draft.turnCounter.toString(36)}`,
      speaker: input.speaker,
      occurredAt: input.occurredAt,
      text: input.text,
      confidence: input.confidence ?? 1
    };
    draft.turns.push(turn);
    return turn;
  }

  appendCorrection(
    input: AppendCorrectionInput
  ): SessionCorrection | null {
    const draft = this.drafts.get(input.sessionId);
    if (!draft) return null;
    draft.correctionCounter += 1;
    const correction: SessionCorrection = {
      id: `${draft.id}-c-${draft.correctionCounter.toString(36)}`,
      turnId: input.turnId,
      before: input.before,
      after: input.after,
      note: input.note
    };
    draft.corrections.push(correction);
    return correction;
  }

  appendPronunciation(input: AppendPronunciationInput): PronunciationDelta | null {
    const draft = this.drafts.get(input.sessionId);
    if (!draft) return null;
    const delta: PronunciationDelta = {
      phoneme: input.phoneme,
      scoreBefore: input.scoreBefore,
      scoreAfter: input.scoreAfter
    };
    draft.pronunciation.push(delta);
    return delta;
  }

  has(id: LessonSessionId): boolean {
    return this.drafts.has(id);
  }

  cancel(id: LessonSessionId): void {
    this.drafts.delete(id);
  }

  finalize(input: CompleteSessionInput): LessonSession | null {
    const draft = this.drafts.get(input.sessionId);
    if (!draft) return null;
    this.drafts.delete(draft.id);
    const startedMs = Date.parse(draft.input.startedAt);
    const completedMs = Date.parse(input.completedAt);
    const durationSeconds = Math.max(
      0,
      Number.isFinite(completedMs - startedMs)
        ? Math.round((completedMs - startedMs) / 1000)
        : 0
    );
    return {
      id: draft.id,
      studentId: draft.input.studentId,
      startedAt: draft.input.startedAt,
      completedAt: input.completedAt,
      levelAtTime: draft.input.levelAtTime,
      topic: draft.input.topic,
      kind: draft.input.kind,
      locale: draft.input.locale,
      participants: draft.input.participants,
      summary: input.summary,
      transcript: draft.turns,
      corrections: draft.corrections,
      pronunciationDeltas: draft.pronunciation,
      durationSeconds,
      score: input.score
    };
  }
}
