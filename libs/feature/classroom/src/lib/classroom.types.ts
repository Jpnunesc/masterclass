import type { I18nKey } from '@shared/i18n';

export const AVATAR_STATES = [
  'idle',
  'listening',
  'thinking',
  'speaking',
  'prompting',
  'encouraging',
  'correcting',
  'offline'
] as const;
export type AvatarState = (typeof AVATAR_STATES)[number];

export const MIC_STATES = [
  'idle',
  'armed',
  'recording',
  'paused',
  'processing',
  'error',
  'denied'
] as const;
export type MicState = (typeof MIC_STATES)[number];

export const AVATAR_TRANSITIONS: Readonly<Record<AvatarState, readonly AvatarState[]>> = {
  idle: ['listening', 'thinking', 'speaking', 'offline'],
  listening: ['idle', 'thinking', 'offline'],
  thinking: ['idle', 'speaking', 'correcting', 'offline'],
  speaking: ['idle', 'prompting', 'encouraging', 'correcting', 'offline'],
  prompting: ['idle', 'listening', 'offline'],
  encouraging: ['idle', 'listening', 'offline'],
  correcting: ['idle', 'listening', 'offline'],
  offline: ['idle']
};

export const MIC_TRANSITIONS: Readonly<Record<MicState, readonly MicState[]>> = {
  idle: ['armed', 'error', 'denied'],
  armed: ['idle', 'recording', 'error'],
  recording: ['idle', 'paused', 'processing', 'error'],
  paused: ['recording', 'error'],
  processing: ['idle', 'armed', 'error'],
  error: ['idle', 'denied'],
  denied: ['idle']
};

export type BoardCardVariant =
  | 'vocabulary'
  | 'grammar'
  | 'exercise'
  | 'correction'
  | 'assessment';

export type ExerciseCardState =
  | 'idle'
  | 'ready'
  | 'submitting'
  | 'graded.correct'
  | 'graded.partial'
  | 'graded.wrong';

export interface VocabularyCard {
  readonly id: string;
  readonly variant: 'vocabulary';
  readonly headword: string;
  readonly translation: string;
  readonly example?: string;
}

export interface GrammarCard {
  readonly id: string;
  readonly variant: 'grammar';
  readonly rule: string;
  readonly example?: string;
}

export interface ExerciseCard {
  readonly id: string;
  readonly variant: 'exercise';
  readonly prompt: string;
  readonly placeholder?: string;
  readonly multiline?: boolean;
  readonly state: ExerciseCardState;
  readonly answer?: string;
}

export interface CorrectionCard {
  readonly id: string;
  readonly variant: 'correction';
  readonly original: string;
  readonly corrected: string;
  readonly note?: string;
}

export interface AssessmentCard {
  readonly id: string;
  readonly variant: 'assessment';
  readonly heading: string;
  readonly body: string;
}

export type BoardCard =
  | VocabularyCard
  | GrammarCard
  | ExerciseCard
  | CorrectionCard
  | AssessmentCard;

export type TurnRole = 'teacher' | 'student' | 'system';

export type SystemTurnKey =
  | 'session_start'
  | 'session_resumed'
  | 'reconnecting'
  | 'paused'
  | 'session_end';

export interface TeacherTurn {
  readonly id: string;
  readonly role: 'teacher';
  readonly text: string;
  readonly streaming?: boolean;
}

export interface StudentTurn {
  readonly id: string;
  readonly role: 'student';
  readonly text: string;
}

export interface SystemTurn {
  readonly id: string;
  readonly role: 'system';
  readonly key: SystemTurnKey;
}

export type TranscriptTurn = TeacherTurn | StudentTurn | SystemTurn;

export type ConnectionState = 'ok' | 'reconnecting' | 'offline';

export interface TeacherIdentity {
  readonly id: string;
  readonly nameKey: I18nKey;
  readonly portraitAlt: I18nKey;
}

export interface LessonMeta {
  readonly id: string;
  readonly titleKey: I18nKey;
  readonly objectiveKey: I18nKey;
  readonly level: string;
}
