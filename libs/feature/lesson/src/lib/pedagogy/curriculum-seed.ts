import type { CefrLevel } from '@feature/assessment';
import type { I18nKey } from '@shared/i18n';

/**
 * Seed curriculum per CEFR level. In production, the Azure OpenAI pedagogy
 * adapter swaps this with a richer, plan-time fetched catalog; this seed is
 * the minimum the planner needs so unit tests can run offline and the stub
 * adapter always has a deterministic floor to start from.
 *
 * Each entry is referenced by i18n key so prompts stay locale-agnostic.
 */
export interface CurriculumEntry {
  readonly id: string;
  readonly cefrLevel: CefrLevel;
  readonly topic: string;
  readonly grammarKey: I18nKey;
  readonly vocabularyKey: I18nKey;
  readonly listeningPromptKey: I18nKey;
  readonly speakingPromptKey: I18nKey;
  readonly readingPromptKey: I18nKey;
  readonly writingPromptKey: I18nKey;
}

export const CURRICULUM_SEED: readonly CurriculumEntry[] = [
  {
    id: 'a1.introductions',
    cefrLevel: 'A1',
    topic: 'introductions',
    grammarKey: 'lesson.curriculum.a1.introductions.grammar',
    vocabularyKey: 'lesson.curriculum.a1.introductions.vocabulary',
    listeningPromptKey: 'lesson.curriculum.a1.introductions.listening',
    speakingPromptKey: 'lesson.curriculum.a1.introductions.speaking',
    readingPromptKey: 'lesson.curriculum.a1.introductions.reading',
    writingPromptKey: 'lesson.curriculum.a1.introductions.writing'
  },
  {
    id: 'a1.daily_routine',
    cefrLevel: 'A1',
    topic: 'daily_routine',
    grammarKey: 'lesson.curriculum.a1.daily_routine.grammar',
    vocabularyKey: 'lesson.curriculum.a1.daily_routine.vocabulary',
    listeningPromptKey: 'lesson.curriculum.a1.daily_routine.listening',
    speakingPromptKey: 'lesson.curriculum.a1.daily_routine.speaking',
    readingPromptKey: 'lesson.curriculum.a1.daily_routine.reading',
    writingPromptKey: 'lesson.curriculum.a1.daily_routine.writing'
  },
  {
    id: 'a2.past_events',
    cefrLevel: 'A2',
    topic: 'past_events',
    grammarKey: 'lesson.curriculum.a2.past_events.grammar',
    vocabularyKey: 'lesson.curriculum.a2.past_events.vocabulary',
    listeningPromptKey: 'lesson.curriculum.a2.past_events.listening',
    speakingPromptKey: 'lesson.curriculum.a2.past_events.speaking',
    readingPromptKey: 'lesson.curriculum.a2.past_events.reading',
    writingPromptKey: 'lesson.curriculum.a2.past_events.writing'
  },
  {
    id: 'a2.travel',
    cefrLevel: 'A2',
    topic: 'travel',
    grammarKey: 'lesson.curriculum.a2.travel.grammar',
    vocabularyKey: 'lesson.curriculum.a2.travel.vocabulary',
    listeningPromptKey: 'lesson.curriculum.a2.travel.listening',
    speakingPromptKey: 'lesson.curriculum.a2.travel.speaking',
    readingPromptKey: 'lesson.curriculum.a2.travel.reading',
    writingPromptKey: 'lesson.curriculum.a2.travel.writing'
  },
  {
    id: 'b1.opinions',
    cefrLevel: 'B1',
    topic: 'opinions',
    grammarKey: 'lesson.curriculum.b1.opinions.grammar',
    vocabularyKey: 'lesson.curriculum.b1.opinions.vocabulary',
    listeningPromptKey: 'lesson.curriculum.b1.opinions.listening',
    speakingPromptKey: 'lesson.curriculum.b1.opinions.speaking',
    readingPromptKey: 'lesson.curriculum.b1.opinions.reading',
    writingPromptKey: 'lesson.curriculum.b1.opinions.writing'
  },
  {
    id: 'b1.work',
    cefrLevel: 'B1',
    topic: 'work',
    grammarKey: 'lesson.curriculum.b1.work.grammar',
    vocabularyKey: 'lesson.curriculum.b1.work.vocabulary',
    listeningPromptKey: 'lesson.curriculum.b1.work.listening',
    speakingPromptKey: 'lesson.curriculum.b1.work.speaking',
    readingPromptKey: 'lesson.curriculum.b1.work.reading',
    writingPromptKey: 'lesson.curriculum.b1.work.writing'
  },
  {
    id: 'b2.media',
    cefrLevel: 'B2',
    topic: 'media',
    grammarKey: 'lesson.curriculum.b2.media.grammar',
    vocabularyKey: 'lesson.curriculum.b2.media.vocabulary',
    listeningPromptKey: 'lesson.curriculum.b2.media.listening',
    speakingPromptKey: 'lesson.curriculum.b2.media.speaking',
    readingPromptKey: 'lesson.curriculum.b2.media.reading',
    writingPromptKey: 'lesson.curriculum.b2.media.writing'
  },
  {
    id: 'b2.environment',
    cefrLevel: 'B2',
    topic: 'environment',
    grammarKey: 'lesson.curriculum.b2.environment.grammar',
    vocabularyKey: 'lesson.curriculum.b2.environment.vocabulary',
    listeningPromptKey: 'lesson.curriculum.b2.environment.listening',
    speakingPromptKey: 'lesson.curriculum.b2.environment.speaking',
    readingPromptKey: 'lesson.curriculum.b2.environment.reading',
    writingPromptKey: 'lesson.curriculum.b2.environment.writing'
  },
  {
    id: 'c1.abstract',
    cefrLevel: 'C1',
    topic: 'abstract_ideas',
    grammarKey: 'lesson.curriculum.c1.abstract.grammar',
    vocabularyKey: 'lesson.curriculum.c1.abstract.vocabulary',
    listeningPromptKey: 'lesson.curriculum.c1.abstract.listening',
    speakingPromptKey: 'lesson.curriculum.c1.abstract.speaking',
    readingPromptKey: 'lesson.curriculum.c1.abstract.reading',
    writingPromptKey: 'lesson.curriculum.c1.abstract.writing'
  },
  {
    id: 'c1.debate',
    cefrLevel: 'C1',
    topic: 'debate',
    grammarKey: 'lesson.curriculum.c1.debate.grammar',
    vocabularyKey: 'lesson.curriculum.c1.debate.vocabulary',
    listeningPromptKey: 'lesson.curriculum.c1.debate.listening',
    speakingPromptKey: 'lesson.curriculum.c1.debate.speaking',
    readingPromptKey: 'lesson.curriculum.c1.debate.reading',
    writingPromptKey: 'lesson.curriculum.c1.debate.writing'
  },
  {
    id: 'c2.nuance',
    cefrLevel: 'C2',
    topic: 'nuance',
    grammarKey: 'lesson.curriculum.c2.nuance.grammar',
    vocabularyKey: 'lesson.curriculum.c2.nuance.vocabulary',
    listeningPromptKey: 'lesson.curriculum.c2.nuance.listening',
    speakingPromptKey: 'lesson.curriculum.c2.nuance.speaking',
    readingPromptKey: 'lesson.curriculum.c2.nuance.reading',
    writingPromptKey: 'lesson.curriculum.c2.nuance.writing'
  }
];

export function entriesForLevel(level: CefrLevel): readonly CurriculumEntry[] {
  return CURRICULUM_SEED.filter((e) => e.cefrLevel === level);
}
