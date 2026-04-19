import type { CefrLevel } from '@feature/assessment';
import type { MaterialKind, MaterialTopic } from '@feature/materials';
import type { SupportedLocale } from '@shared/i18n';

export type LessonSessionId = string;

export const SESSION_SPEAKERS = ['student', 'ai_teacher'] as const;
export type SessionSpeaker = (typeof SESSION_SPEAKERS)[number];

export interface TranscriptTurn {
  readonly id: string;
  readonly speaker: SessionSpeaker;
  readonly occurredAt: string;
  readonly text: string;
  readonly confidence: number;
}

export interface SessionCorrection {
  readonly id: string;
  readonly turnId: string;
  readonly before: string;
  readonly after: string;
  readonly note: string;
}

export interface PronunciationDelta {
  readonly phoneme: string;
  readonly scoreBefore: number;
  readonly scoreAfter: number;
}

export interface SessionParticipant {
  readonly kind: SessionSpeaker;
  readonly displayName: string;
}

export interface LessonSession {
  readonly id: LessonSessionId;
  readonly studentId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly levelAtTime: CefrLevel;
  readonly topic: MaterialTopic;
  readonly kind: MaterialKind;
  readonly locale: SupportedLocale;
  readonly participants: readonly SessionParticipant[];
  readonly summary: string;
  readonly transcript: readonly TranscriptTurn[];
  readonly corrections: readonly SessionCorrection[];
  readonly pronunciationDeltas: readonly PronunciationDelta[];
  readonly durationSeconds: number;
  readonly score: number;
}

export interface SessionSearchQuery {
  readonly text: string;
  readonly level: CefrLevel | 'all';
  readonly topic: MaterialTopic | 'all';
}

export const INITIAL_SESSION_SEARCH_QUERY: SessionSearchQuery = {
  text: '',
  level: 'all',
  topic: 'all'
};

export type LessonHistoryPhase = 'idle' | 'ready' | 'recording';

export interface LessonHistoryState {
  readonly phase: LessonHistoryPhase;
  readonly sessions: readonly LessonSession[];
  readonly activeRecording: LessonSessionId | null;
  readonly selectedId: LessonSessionId | null;
  readonly query: SessionSearchQuery;
  readonly lastSearchDurationMs: number;
}

export const INITIAL_LESSON_HISTORY_STATE: LessonHistoryState = {
  phase: 'idle',
  sessions: [],
  activeRecording: null,
  selectedId: null,
  query: INITIAL_SESSION_SEARCH_QUERY,
  lastSearchDurationMs: 0
};

export interface StartSessionInput {
  readonly studentId: string;
  readonly levelAtTime: CefrLevel;
  readonly topic: MaterialTopic;
  readonly kind: MaterialKind;
  readonly locale: SupportedLocale;
  readonly startedAt: string;
  readonly participants: readonly SessionParticipant[];
}

export interface AppendTurnInput {
  readonly sessionId: LessonSessionId;
  readonly speaker: SessionSpeaker;
  readonly text: string;
  readonly occurredAt: string;
  readonly confidence?: number;
}

export interface AppendCorrectionInput {
  readonly sessionId: LessonSessionId;
  readonly turnId: string;
  readonly before: string;
  readonly after: string;
  readonly note: string;
}

export interface AppendPronunciationInput {
  readonly sessionId: LessonSessionId;
  readonly phoneme: string;
  readonly scoreBefore: number;
  readonly scoreAfter: number;
}

export interface CompleteSessionInput {
  readonly sessionId: LessonSessionId;
  readonly completedAt: string;
  readonly summary: string;
  readonly score: number;
}
