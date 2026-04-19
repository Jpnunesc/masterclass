import { Provider } from '@angular/core';

import type { SupportedLocale } from '@shared/i18n';

import type {
  ExerciseQuestion,
  LessonSection,
  MaterialBody,
  MaterialKind,
  VocabularyCard
} from '../domain/material.types';
import type { MaterialPrompt } from '../pipeline/prompt';
import {
  AZURE_OPENAI_CONTENT,
  type AzureOpenAiContent,
  type GenerateContentResult
} from './azure-openai-content.client';

/**
 * Deterministic stub generator used offline and in unit tests. Given the same
 * prompt, returns the same output — which lets the content store serve a
 * stable cache entry and lets tests assert byte-for-byte output. Production
 * swaps this out for the real Azure OpenAI adapter via DI.
 */
export class StubAzureOpenAiContent implements AzureOpenAiContent {
  async generate(prompt: MaterialPrompt): Promise<GenerateContentResult> {
    const title = buildTitle(prompt);
    const summary = buildSummary(prompt);
    const body = buildBody(prompt);
    return {
      title,
      summary,
      body,
      estimatedMinutes: estimateMinutes(prompt.kind)
    };
  }
}

export function provideMaterialsStubs(): Provider[] {
  return [{ provide: AZURE_OPENAI_CONTENT, useClass: StubAzureOpenAiContent }];
}

function estimateMinutes(kind: MaterialKind): number {
  switch (kind) {
    case 'lesson':
      return 8;
    case 'vocabulary':
      return 4;
    case 'exercise':
      return 6;
    case 'summary':
      return 2;
  }
}

function buildTitle(prompt: MaterialPrompt): string {
  const topic = humanizeTopic(prompt.topic, prompt.locale);
  if (prompt.locale === 'pt-BR') {
    switch (prompt.kind) {
      case 'lesson':
        return `Aula ${prompt.level}: ${topic}`;
      case 'vocabulary':
        return `Vocabulário ${prompt.level}: ${topic}`;
      case 'exercise':
        return `Exercícios ${prompt.level}: ${topic}`;
      case 'summary':
        return `Resumo ${prompt.level}: ${topic}`;
    }
  }
  switch (prompt.kind) {
    case 'lesson':
      return `Lesson ${prompt.level}: ${topic}`;
    case 'vocabulary':
      return `Vocabulary ${prompt.level}: ${topic}`;
    case 'exercise':
      return `Exercises ${prompt.level}: ${topic}`;
    case 'summary':
      return `Summary ${prompt.level}: ${topic}`;
  }
}

function buildSummary(prompt: MaterialPrompt): string {
  const topic = humanizeTopic(prompt.topic, prompt.locale);
  if (prompt.locale === 'pt-BR') {
    return `Material gerado em nível ${prompt.level} sobre ${topic}.`;
  }
  return `Generated material at level ${prompt.level} covering ${topic}.`;
}

function humanizeTopic(topic: string, locale: SupportedLocale): string {
  const en: Record<string, string> = {
    daily_life: 'Daily life',
    travel: 'Travel',
    work: 'Work',
    culture: 'Culture',
    science: 'Science',
    tech: 'Technology',
    grammar: 'Grammar',
    pronunciation: 'Pronunciation'
  };
  const pt: Record<string, string> = {
    daily_life: 'Dia a dia',
    travel: 'Viagem',
    work: 'Trabalho',
    culture: 'Cultura',
    science: 'Ciência',
    tech: 'Tecnologia',
    grammar: 'Gramática',
    pronunciation: 'Pronúncia'
  };
  const dict = locale === 'pt-BR' ? pt : en;
  return dict[topic] ?? topic;
}

function buildBody(prompt: MaterialPrompt): MaterialBody {
  switch (prompt.kind) {
    case 'lesson':
      return { kind: 'lesson', sections: lessonSections(prompt) };
    case 'vocabulary':
      return { kind: 'vocabulary', cards: vocabularyCards(prompt) };
    case 'exercise':
      return { kind: 'exercise', questions: exerciseQuestions(prompt) };
    case 'summary':
      return { kind: 'summary', bullets: summaryBullets(prompt) };
  }
}

function lessonSections(prompt: MaterialPrompt): readonly LessonSection[] {
  const topic = humanizeTopic(prompt.topic, prompt.locale);
  if (prompt.locale === 'pt-BR') {
    return [
      {
        heading: `Contexto: ${topic}`,
        body: `Uma introdução curta ao tópico em nível ${prompt.level}, com vocabulário e estruturas apropriadas para o aluno.`
      },
      {
        heading: 'Exemplos em uso',
        body: `Três frases curtas que mostram como o tema aparece em conversas reais.`
      },
      {
        heading: 'Prática sugerida',
        body: `Uma atividade de 5 minutos para consolidar o que foi visto acima.`
      }
    ];
  }
  return [
    {
      heading: `Context: ${topic}`,
      body: `A short introduction to the topic at level ${prompt.level}, with vocabulary and structures appropriate for the learner.`
    },
    {
      heading: 'Examples in use',
      body: `Three short sentences showing how the theme appears in real conversations.`
    },
    {
      heading: 'Suggested practice',
      body: `A five-minute activity to consolidate what was covered above.`
    }
  ];
}

function vocabularyCards(prompt: MaterialPrompt): readonly VocabularyCard[] {
  const topic = humanizeTopic(prompt.topic, prompt.locale);
  const base: readonly VocabularyCard[] =
    prompt.locale === 'pt-BR'
      ? [
          {
            term: 'to commute',
            translation: 'ir ao trabalho/ir e voltar',
            example: `Eu faço commute todos os dias (${topic}).`
          },
          {
            term: 'routine',
            translation: 'rotina',
            example: `Minha routine da manhã começa às sete.`
          },
          {
            term: 'deadline',
            translation: 'prazo',
            example: `O deadline do projeto é na sexta.`
          },
          {
            term: 'feedback',
            translation: 'retorno',
            example: `Recebi bom feedback sobre ${topic}.`
          }
        ]
      : [
          {
            term: 'to commute',
            translation: 'deslocar-se',
            example: `I commute to work every day (${topic}).`
          },
          {
            term: 'routine',
            translation: 'daily order of tasks',
            example: `My morning routine starts at seven.`
          },
          {
            term: 'deadline',
            translation: 'time limit',
            example: `The project deadline is on Friday.`
          },
          {
            term: 'feedback',
            translation: 'reaction, response',
            example: `I received good feedback on ${topic}.`
          }
        ];
  return base;
}

function exerciseQuestions(
  prompt: MaterialPrompt
): readonly ExerciseQuestion[] {
  if (prompt.locale === 'pt-BR') {
    return [
      {
        prompt: 'Qual é a forma correta do verbo?',
        choices: ['She go', 'She goes', 'She going', 'She gone'],
        answerIndex: 1,
        explanation: 'Terceira pessoa do singular no presente leva -s.'
      },
      {
        prompt: 'Escolha a preposição correta.',
        choices: ['at', 'on', 'in', 'for'],
        answerIndex: 2,
        explanation: '"in" para meses e anos.'
      },
      {
        prompt: 'Complete: "I have ___ to Brazil twice."',
        choices: ['went', 'gone', 'been', 'goes'],
        answerIndex: 2,
        explanation: '"have been to" indica experiência.'
      }
    ];
  }
  return [
    {
      prompt: 'Choose the correct verb form.',
      choices: ['She go', 'She goes', 'She going', 'She gone'],
      answerIndex: 1,
      explanation: 'Third person singular in the present takes -s.'
    },
    {
      prompt: 'Choose the correct preposition.',
      choices: ['at', 'on', 'in', 'for'],
      answerIndex: 2,
      explanation: 'Use "in" with months and years.'
    },
    {
      prompt: 'Complete: "I have ___ to Brazil twice."',
      choices: ['went', 'gone', 'been', 'goes'],
      answerIndex: 2,
      explanation: '"have been to" describes experience.'
    }
  ];
}

function summaryBullets(prompt: MaterialPrompt): readonly string[] {
  const topic = humanizeTopic(prompt.topic, prompt.locale);
  if (prompt.locale === 'pt-BR') {
    return [
      `Foco: ${topic} em nível ${prompt.level}.`,
      'Revise três frases-chave que você estudou hoje.',
      'Anote uma dúvida para a próxima aula.',
      'Pratique uma frase em voz alta antes de dormir.'
    ];
  }
  return [
    `Focus: ${topic} at level ${prompt.level}.`,
    'Review the three key phrases you studied today.',
    'Write down one question for your next class.',
    'Practise one sentence aloud before bed.'
  ];
}
