import type { CefrLevel } from '@feature/assessment';

export type LibrarySkill =
  | 'speaking'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'vocabulary'
  | 'grammar'
  | 'pronunciation';

export type LibraryTag =
  | 'business'
  | 'travel'
  | 'everyday'
  | 'academic'
  | 'interviews';

export type LessonStatus = 'inProgress' | 'saved' | 'available';

/**
 * A lesson in the student's library. Distinct from the AI-generated Material
 * model: lessons have a CEFR level, a single skill focus, a topic tag, and a
 * completion percentage. The MaterialsService v0 model still serves the
 * generate-and-browse experience; this type powers the SEV-19 Library + Review
 * surfaces.
 */
export interface LibraryLesson {
  readonly id: string;
  readonly title: string;
  readonly level: CefrLevel;
  readonly topic: string;
  readonly skill: LibrarySkill;
  readonly tag: LibraryTag;
  readonly durationMinutes: number;
  readonly progress: number; // 0..100
  readonly saved: boolean;
  readonly completedAt: string | null;
  readonly startedAt: string | null;
}

export type LibraryDensity = 'compact' | 'comfortable' | 'spacious';

export const LIBRARY_DENSITIES: readonly LibraryDensity[] = [
  'compact',
  'comfortable',
  'spacious'
] as const;

export const DENSITY_STORAGE_KEY = 'mc.density.materials';

export interface LibraryFilter {
  readonly levels: readonly CefrLevel[];
  readonly skills: readonly LibrarySkill[];
  readonly tags: readonly LibraryTag[];
}

export const EMPTY_FILTER: LibraryFilter = {
  levels: [],
  skills: [],
  tags: []
} as const;
