import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClient } from '@shared/api';
import type { SupportedLocale } from '@shared/i18n';

import type {
  ExerciseQuestion,
  LessonSection,
  MaterialBody,
  MaterialKind,
  VocabularyCard
} from '../domain/material.types';
import type { MaterialPrompt } from '../pipeline/prompt';
import type {
  AzureOpenAiContent,
  GenerateContentResult
} from './azure-openai-content.client';

interface VocabularyEntry {
  readonly term: string;
  readonly definition: string;
  readonly exampleUsage: string;
}

interface BackendExercise {
  readonly prompt: string;
  readonly kind: string;
  readonly hint: string | null;
  readonly expectedAnswer: string | null;
}

interface GeneratedMaterials {
  readonly lessonTitle: string;
  readonly lessonSummary: string;
  readonly vocabulary: readonly VocabularyEntry[];
  readonly exercises: readonly BackendExercise[];
}

interface BackendRequest {
  readonly level: string;
  readonly topic: string;
  readonly vocabCount: number;
  readonly exerciseCount: number;
  readonly targetLanguage: string;
}

const TARGET_LANGUAGE: Record<SupportedLocale, string> = {
  en: 'English',
  'pt-BR': 'Portuguese (Brazil)'
};

const COUNT_BY_KIND: Record<MaterialKind, { vocab: number; exercise: number }> = {
  lesson: { vocab: 4, exercise: 3 },
  vocabulary: { vocab: 6, exercise: 0 },
  exercise: { vocab: 0, exercise: 5 },
  summary: { vocab: 4, exercise: 0 }
};

const EST_MINUTES: Record<MaterialKind, number> = {
  lesson: 8,
  vocabulary: 4,
  exercise: 6,
  summary: 2
};

@Injectable({ providedIn: 'root' })
export class AzureOpenAiContentHttp implements AzureOpenAiContent {
  private readonly api = inject(ApiClient);

  async generate(prompt: MaterialPrompt): Promise<GenerateContentResult> {
    const counts = COUNT_BY_KIND[prompt.kind];
    const body: BackendRequest = {
      level: prompt.level,
      topic: prompt.topic,
      vocabCount: counts.vocab,
      exerciseCount: counts.exercise,
      targetLanguage: TARGET_LANGUAGE[prompt.locale] ?? TARGET_LANGUAGE.en
    };
    const result = await firstValueFrom(
      this.api.post<GeneratedMaterials>('/api/materials/generate', body)
    );
    return {
      title: result.lessonTitle,
      summary: result.lessonSummary,
      body: toMaterialBody(prompt.kind, result),
      estimatedMinutes: EST_MINUTES[prompt.kind]
    };
  }
}

function toMaterialBody(
  kind: MaterialKind,
  result: GeneratedMaterials
): MaterialBody {
  switch (kind) {
    case 'lesson':
      return { kind: 'lesson', sections: lessonSections(result) };
    case 'vocabulary':
      return { kind: 'vocabulary', cards: vocabularyCards(result.vocabulary) };
    case 'exercise':
      return {
        kind: 'exercise',
        questions: exerciseQuestions(result.exercises)
      };
    case 'summary':
      return { kind: 'summary', bullets: summaryBullets(result.lessonSummary) };
  }
}

function lessonSections(result: GeneratedMaterials): readonly LessonSection[] {
  const sections: LessonSection[] = [
    { heading: result.lessonTitle, body: result.lessonSummary }
  ];
  const vocabSample = result.vocabulary.slice(0, 3);
  if (vocabSample.length > 0) {
    sections.push({
      heading: 'Key vocabulary',
      body: vocabSample
        .map((v) => `${v.term} — ${v.definition}`)
        .join(' • ')
    });
  }
  const firstExercise = result.exercises[0];
  if (firstExercise) {
    sections.push({ heading: 'Try it', body: firstExercise.prompt });
  }
  return sections;
}

function vocabularyCards(
  entries: readonly VocabularyEntry[]
): readonly VocabularyCard[] {
  return entries.map((v) => ({
    term: v.term,
    translation: v.definition,
    example: v.exampleUsage
  }));
}

// Backend Exercise lacks `choices`/`answerIndex` — single-answer free-form.
// Surface a degraded multiple-choice (correct + "I'm not sure") so the
// existing renderer keeps working. Tracked as follow-up: backend should
// emit choice arrays when materials.kind === 'exercise'.
function exerciseQuestions(
  exercises: readonly BackendExercise[]
): readonly ExerciseQuestion[] {
  return exercises.map((ex) => {
    const expected = ex.expectedAnswer?.trim() ?? '';
    const choices = expected.length > 0 ? [expected, "I'm not sure"] : ["I'm not sure"];
    return {
      prompt: ex.prompt,
      choices,
      answerIndex: 0,
      explanation: ex.hint ?? undefined
    };
  });
}

function summaryBullets(summary: string): readonly string[] {
  const trimmed = summary.trim();
  if (!trimmed) return [];
  const split = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return split.length > 0 ? split : [trimmed];
}
