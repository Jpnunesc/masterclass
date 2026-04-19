import { Provider } from '@angular/core';

import { CEFR_LEVELS, CEFR_ORDINALS, type CefrLevel } from '@feature/assessment';

import type { Goal, SkillKey } from '../domain/progress.types';
import {
  AZURE_OPENAI_GOALS,
  type AzureOpenAiGoals,
  type SuggestGoalsInput
} from './azure-openai-goals.client';

/**
 * Deterministic offline stub. Given the same inputs, returns the same goals —
 * so tests can assert exact output and the dev build has a coherent goals
 * surface without calling Azure OpenAI.
 */
export class StubAzureOpenAiGoals implements AzureOpenAiGoals {
  async suggest(input: SuggestGoalsInput): Promise<readonly Goal[]> {
    const { snapshot, locale, limit } = input;
    const weakest = pickWeakestSkill(snapshot.skills);
    const target = nextLevel(snapshot.level);
    const createdAt = snapshot.updatedAt;
    const goals: Goal[] = [];

    goals.push({
      id: `goal-overall-${target}`,
      title:
        locale === 'pt-BR'
          ? `Alcance o nível ${target}`
          : `Reach level ${target}`,
      detail:
        locale === 'pt-BR'
          ? `Continue praticando para subir de ${snapshot.level} para ${target}.`
          : `Keep practising to move from ${snapshot.level} to ${target}.`,
      targetSkill: 'overall',
      targetLevel: target,
      targetScore: clamp01(CEFR_ORDINALS[target] / (CEFR_LEVELS.length - 1)),
      createdAt,
      dueAt: null,
      origin: 'heuristic',
      completedAt: null
    });

    goals.push({
      id: `goal-skill-${weakest}`,
      title:
        locale === 'pt-BR'
          ? `Reforce ${skillLabelPt(weakest)}`
          : `Strengthen ${skillLabelEn(weakest)}`,
      detail:
        locale === 'pt-BR'
          ? `Dedique 3 sessões curtas a ${skillLabelPt(weakest)} esta semana.`
          : `Spend three short sessions on ${skillLabelEn(weakest)} this week.`,
      targetSkill: weakest,
      targetLevel: target,
      targetScore: clamp01(snapshot.skills[weakest].score + 0.15),
      createdAt,
      dueAt: null,
      origin: 'heuristic',
      completedAt: null
    });

    goals.push({
      id: 'goal-streak-7',
      title: locale === 'pt-BR' ? 'Sequência de 7 dias' : '7-day streak',
      detail:
        locale === 'pt-BR'
          ? 'Faça ao menos uma aula por dia durante uma semana.'
          : 'Complete at least one lesson every day for a week.',
      targetSkill: 'overall',
      targetLevel: snapshot.level,
      targetScore: snapshot.overallScore,
      createdAt,
      dueAt: null,
      origin: 'heuristic',
      completedAt: null
    });

    return goals.slice(0, Math.max(1, limit));
  }
}

export function provideProgressStubs(): Provider[] {
  return [{ provide: AZURE_OPENAI_GOALS, useClass: StubAzureOpenAiGoals }];
}

function pickWeakestSkill(
  skills: SuggestGoalsInput['snapshot']['skills']
): SkillKey {
  const keys: SkillKey[] = ['listen', 'speak', 'read', 'write'];
  let weakest: SkillKey = 'listen';
  let min = Infinity;
  for (const key of keys) {
    if (skills[key].score < min) {
      min = skills[key].score;
      weakest = key;
    }
  }
  return weakest;
}

function nextLevel(current: CefrLevel): CefrLevel {
  const idx = CEFR_ORDINALS[current];
  const nextIdx = Math.min(CEFR_LEVELS.length - 1, idx + 1);
  return CEFR_LEVELS[nextIdx];
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function skillLabelEn(key: SkillKey): string {
  switch (key) {
    case 'listen':
      return 'listening';
    case 'speak':
      return 'speaking';
    case 'read':
      return 'reading';
    case 'write':
      return 'writing';
  }
}

function skillLabelPt(key: SkillKey): string {
  switch (key) {
    case 'listen':
      return 'a escuta';
    case 'speak':
      return 'a fala';
    case 'read':
      return 'a leitura';
    case 'write':
      return 'a escrita';
  }
}
