import type { CefrLevel } from '@feature/assessment';
import type { SupportedLocale } from '@shared/i18n';

export const MATERIAL_KINDS = [
  'lesson',
  'vocabulary',
  'exercise',
  'summary'
] as const;

export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export type MaterialId = string;

/**
 * Stable topic taxonomy. The catalog is shared across AI prompts (so the model
 * sees canonical keys, not localized strings) and UI filters. Translations live
 * in the i18n catalog under `materials.topic.<id>`.
 */
export const MATERIAL_TOPICS = [
  'daily_life',
  'travel',
  'work',
  'culture',
  'science',
  'tech',
  'grammar',
  'pronunciation'
] as const;

export type MaterialTopic = (typeof MATERIAL_TOPICS)[number];

export interface VocabularyCard {
  readonly term: string;
  readonly translation: string;
  readonly example: string;
}

export interface ExerciseQuestion {
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly answerIndex: number;
  readonly explanation?: string;
}

export interface LessonSection {
  readonly heading: string;
  readonly body: string;
}

export type MaterialBody =
  | { readonly kind: 'lesson'; readonly sections: readonly LessonSection[] }
  | { readonly kind: 'vocabulary'; readonly cards: readonly VocabularyCard[] }
  | { readonly kind: 'exercise'; readonly questions: readonly ExerciseQuestion[] }
  | { readonly kind: 'summary'; readonly bullets: readonly string[] };

/**
 * A student-facing learning artifact. The body shape is discriminated by
 * `kind` so renderers can narrow exhaustively. `promptHash` + `version` are the
 * cache key on the server side and allow deterministic regeneration.
 */
export interface Material {
  readonly id: MaterialId;
  readonly studentId: string;
  readonly kind: MaterialKind;
  readonly level: CefrLevel;
  readonly topic: MaterialTopic;
  readonly locale: SupportedLocale;
  readonly title: string;
  readonly summary: string;
  readonly body: MaterialBody;
  readonly promptHash: string;
  readonly version: number;
  readonly generatedAt: string;
  readonly viewedAt: string | null;
  readonly favorite: boolean;
  readonly estimatedMinutes: number;
}

export interface MaterialsFilter {
  readonly level: CefrLevel | 'all';
  readonly topic: MaterialTopic | 'all';
  readonly recentOnly: boolean;
  readonly favoritesOnly: boolean;
  readonly search: string;
}

export const INITIAL_MATERIALS_FILTER: MaterialsFilter = {
  level: 'all',
  topic: 'all',
  recentOnly: false,
  favoritesOnly: false,
  search: ''
};

export interface GenerateMaterialInput {
  readonly studentId: string;
  readonly kind: MaterialKind;
  readonly level: CefrLevel;
  readonly topic: MaterialTopic;
  readonly locale: SupportedLocale;
}

export type MaterialsPhase = 'idle' | 'generating' | 'ready' | 'error';

export interface MaterialsState {
  readonly phase: MaterialsPhase;
  readonly items: readonly Material[];
  readonly filter: MaterialsFilter;
  readonly activeTab: MaterialKind;
  readonly error: string | null;
}

export const INITIAL_MATERIALS_STATE: MaterialsState = {
  phase: 'idle',
  items: [],
  filter: INITIAL_MATERIALS_FILTER,
  activeTab: 'lesson',
  error: null
};
