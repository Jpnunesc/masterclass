export interface VocabularyItem {
  readonly term: string;           // English, never localized
  readonly ipa: string;            // locale-agnostic
  readonly gloss: string;          // localized
  readonly examples: readonly string[]; // English sentences
  readonly translations?: readonly string[]; // PT translations for examples
}

export interface GrammarItem {
  readonly rule: string;           // localized sentence
  readonly examples: readonly string[]; // English sentences
  readonly hint?: string;          // optional localized aside
}

export interface CorrectionItem {
  readonly studentLine: string;    // verbatim English
  readonly correctedLine: string;  // verbatim English
  readonly teacherNote: string;    // localized
}

export type TranscriptSpeaker = 'teacher' | 'student';

export interface TranscriptTurn {
  readonly id: string;
  readonly speaker: TranscriptSpeaker;
  readonly seconds: number;
  readonly text: string;           // verbatim (not localized)
}

export interface LessonReview {
  readonly lessonId: string;
  readonly title: string;          // localized
  readonly dateISO: string;
  readonly durationMinutes: number;
  readonly progress: number;
  readonly summary: string;        // localized
  readonly stats: {
    readonly wordsSpoken: number;
    readonly newVocabCount: number;
    readonly reviewedVocabCount: number;
  };
  readonly wins: readonly string[];    // localized bullets
  readonly focus: readonly string[];   // localized bullets
  readonly vocabulary: readonly VocabularyItem[];
  readonly grammar: readonly GrammarItem[];
  readonly corrections: readonly CorrectionItem[];
  readonly transcript: readonly TranscriptTurn[];
}

export type ReviewTab =
  | 'overview'
  | 'vocabulary'
  | 'grammar'
  | 'corrections'
  | 'transcript';

export const REVIEW_TABS: readonly ReviewTab[] = [
  'overview',
  'vocabulary',
  'grammar',
  'corrections',
  'transcript'
] as const;
