import type { SupportedLocale } from '@shared/i18n';

import type {
  GenerateMaterialInput,
  MaterialKind,
  MaterialTopic
} from '../domain/material.types';

/**
 * Deterministic prompt envelope. The live Azure OpenAI adapter receives this
 * exact shape; the stub client hashes it to produce a stable seed. Changing
 * either the template string or the shape bumps the effective prompt hash so
 * downstream caches must regenerate.
 */
export interface MaterialPrompt {
  readonly kind: MaterialKind;
  readonly topic: MaterialTopic;
  readonly level: string;
  readonly locale: SupportedLocale;
  readonly system: string;
  readonly user: string;
  readonly hash: string;
  readonly templateVersion: number;
}

export const MATERIAL_PROMPT_TEMPLATE_VERSION = 1;

const SYSTEM_BY_KIND_EN: Readonly<Record<MaterialKind, string>> = {
  lesson:
    'You are an English teacher. Produce a short CEFR-calibrated lesson with two or three sections, each with a heading and a concise paragraph. Keep language level-appropriate and culturally neutral.',
  vocabulary:
    'You are an English teacher. Produce a small vocabulary deck of 4–6 cards. Each card has a term, a translation into the student locale, and a short example sentence. Keep terms at the requested CEFR level.',
  exercise:
    'You are an English teacher. Produce 3–5 multiple-choice practice questions with four choices each, an answer index, and a one-line explanation. Keep distractors plausible but unambiguous.',
  summary:
    'You are an English teacher. Produce a short bullet summary of 4–6 points the student should remember from the topic at the requested CEFR level. Use plain language.'
};

const SYSTEM_BY_KIND_PT: Readonly<Record<MaterialKind, string>> = {
  lesson:
    'Você é um professor de inglês. Produza uma aula curta calibrada para o nível CEFR com duas ou três seções, cada uma com um título e um parágrafo conciso. Mantenha a linguagem apropriada ao nível e culturalmente neutra.',
  vocabulary:
    'Você é um professor de inglês. Produza um pequeno baralho de 4 a 6 cartões de vocabulário. Cada cartão tem um termo, uma tradução para o português e uma frase de exemplo curta.',
  exercise:
    'Você é um professor de inglês. Produza de 3 a 5 questões de múltipla escolha com quatro alternativas cada, um índice de resposta e uma explicação de uma linha.',
  summary:
    'Você é um professor de inglês. Produza um resumo em bullets de 4 a 6 pontos que o aluno deve lembrar sobre o tópico no nível CEFR solicitado. Use linguagem simples.'
};

export function buildMaterialPrompt(
  input: GenerateMaterialInput
): MaterialPrompt {
  const sys =
    input.locale === 'pt'
      ? SYSTEM_BY_KIND_PT[input.kind]
      : SYSTEM_BY_KIND_EN[input.kind];
  const user =
    input.locale === 'pt'
      ? `Gere um material do tipo "${input.kind}" no nível CEFR ${input.level} sobre o tópico "${input.topic}". Responda em JSON estrito, sem texto extra.`
      : `Generate a "${input.kind}" material at CEFR level ${input.level} on the topic "${input.topic}". Reply with strict JSON, no extra prose.`;
  const canonical = canonicalize({
    kind: input.kind,
    level: input.level,
    topic: input.topic,
    locale: input.locale,
    system: sys,
    user,
    templateVersion: MATERIAL_PROMPT_TEMPLATE_VERSION
  });
  return {
    kind: input.kind,
    topic: input.topic,
    level: input.level,
    locale: input.locale,
    system: sys,
    user,
    hash: hashString(canonical),
    templateVersion: MATERIAL_PROMPT_TEMPLATE_VERSION
  };
}

function canonicalize(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  return keys.map((k) => `${k}=${String(obj[k])}`).join('|');
}

/**
 * Deterministic 32-bit FNV-1a hash expressed as 8-char hex. Used only to key
 * cache entries — not a security primitive. Kept inline so the offline build
 * needs no extra dependencies.
 */
export function hashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
