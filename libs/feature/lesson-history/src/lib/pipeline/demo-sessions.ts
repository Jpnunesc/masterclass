import type { SupportedLocale } from '@shared/i18n';

import type { LessonSession } from '../domain/lesson-session.types';

/**
 * Tiny dev-harness seed so the history page renders something when the app
 * boots cold. Production wires the real session stream — this helper only runs
 * when the store is still empty. Keeping the content bilingual keeps the EN/PT
 * screenshot parity work honest.
 */
export function seedDemoSessions(
  locale: SupportedLocale
): readonly LessonSession[] {
  const now = Date.now();
  const base = (daysAgo: number): Date => new Date(now - daysAgo * 86_400_000);
  const pt = locale === 'pt-BR';

  const s1Start = base(2);
  const s1End = new Date(s1Start.getTime() + 18 * 60_000);

  const s2Start = base(6);
  const s2End = new Date(s2Start.getTime() + 22 * 60_000);

  const s3Start = base(11);
  const s3End = new Date(s3Start.getTime() + 15 * 60_000);

  return [
    {
      id: 'demo-session-a',
      studentId: 'anonymous',
      startedAt: s1Start.toISOString(),
      completedAt: s1End.toISOString(),
      levelAtTime: 'B1',
      topic: 'travel',
      kind: 'lesson',
      locale,
      participants: [
        { kind: 'student', displayName: 'You' },
        { kind: 'ai_teacher', displayName: 'MasterClass AI' }
      ],
      summary: pt
        ? 'Roleplay no aeroporto: check-in, bagagem e perguntas ao atendente.'
        : 'Airport roleplay: check-in, baggage and asking the gate agent.',
      transcript: [
        {
          id: 'demo-a-t-1',
          speaker: 'ai_teacher',
          occurredAt: s1Start.toISOString(),
          text: pt
            ? 'Bem-vindo ao check-in. Você vai viajar de bagagem de mão ou despachada?'
            : 'Welcome to check-in. Are you flying carry-on or checking a bag?',
          confidence: 1
        },
        {
          id: 'demo-a-t-2',
          speaker: 'student',
          occurredAt: new Date(s1Start.getTime() + 20_000).toISOString(),
          text: pt
            ? 'Eu gostaria para despachar uma mala, por favor.'
            : 'I like to check one bag, please.',
          confidence: 0.82
        },
        {
          id: 'demo-a-t-3',
          speaker: 'ai_teacher',
          occurredAt: new Date(s1Start.getTime() + 45_000).toISOString(),
          text: pt
            ? 'Ótimo. Por favor, coloque a mala na esteira. Uma observação: "I would like to check".'
            : 'Great. Please place the bag on the belt. Quick note: say "I would like to check".',
          confidence: 1
        }
      ],
      corrections: [
        {
          id: 'demo-a-c-1',
          turnId: 'demo-a-t-2',
          before: pt
            ? 'Eu gostaria para despachar uma mala'
            : 'I like to check one bag',
          after: pt
            ? 'Eu gostaria de despachar uma mala'
            : 'I would like to check one bag',
          note: pt
            ? 'Use "gostaria de" + verbo no infinitivo para pedidos formais.'
            : 'Use "would like to" + base verb for polite requests.'
        }
      ],
      pronunciationDeltas: [
        { phoneme: 'θ', scoreBefore: 0.62, scoreAfter: 0.78 },
        { phoneme: 'æ', scoreBefore: 0.71, scoreAfter: 0.74 }
      ],
      durationSeconds: 18 * 60,
      score: 0.78
    },
    {
      id: 'demo-session-b',
      studentId: 'anonymous',
      startedAt: s2Start.toISOString(),
      completedAt: s2End.toISOString(),
      levelAtTime: 'B1',
      topic: 'work',
      kind: 'lesson',
      locale,
      participants: [
        { kind: 'student', displayName: 'You' },
        { kind: 'ai_teacher', displayName: 'MasterClass AI' }
      ],
      summary: pt
        ? 'Reunião de standup: reportar progresso, bloqueios e próximos passos.'
        : 'Standup roleplay: reporting progress, blockers and next steps.',
      transcript: [
        {
          id: 'demo-b-t-1',
          speaker: 'ai_teacher',
          occurredAt: s2Start.toISOString(),
          text: pt
            ? 'Sua vez no standup: o que você fez ontem?'
            : 'Your turn in standup: what did you do yesterday?',
          confidence: 1
        },
        {
          id: 'demo-b-t-2',
          speaker: 'student',
          occurredAt: new Date(s2Start.getTime() + 18_000).toISOString(),
          text: pt
            ? 'Ontem eu finalizei o design da página de login e abri um PR para revisão.'
            : 'Yesterday I finished the login page design and opened a PR for review.',
          confidence: 0.89
        },
        {
          id: 'demo-b-t-3',
          speaker: 'ai_teacher',
          occurredAt: new Date(s2Start.getTime() + 40_000).toISOString(),
          text: pt
            ? 'Ótimo progresso. Algum bloqueio?'
            : 'Nice progress. Any blockers?',
          confidence: 1
        },
        {
          id: 'demo-b-t-4',
          speaker: 'student',
          occurredAt: new Date(s2Start.getTime() + 70_000).toISOString(),
          text: pt
            ? 'Estou esperando tokens de autenticação do time de infra.'
            : 'I am waiting for auth tokens from the infra team.',
          confidence: 0.91
        }
      ],
      corrections: [],
      pronunciationDeltas: [
        { phoneme: 'ɹ', scoreBefore: 0.66, scoreAfter: 0.69 }
      ],
      durationSeconds: 22 * 60,
      score: 0.82
    },
    {
      id: 'demo-session-c',
      studentId: 'anonymous',
      startedAt: s3Start.toISOString(),
      completedAt: s3End.toISOString(),
      levelAtTime: 'A2',
      topic: 'daily_life',
      kind: 'lesson',
      locale,
      participants: [
        { kind: 'student', displayName: 'You' },
        { kind: 'ai_teacher', displayName: 'MasterClass AI' }
      ],
      summary: pt
        ? 'Conversa sobre rotina matinal: horários, hábitos e café da manhã.'
        : 'Small talk about the morning routine: times, habits and breakfast.',
      transcript: [
        {
          id: 'demo-c-t-1',
          speaker: 'ai_teacher',
          occurredAt: s3Start.toISOString(),
          text: pt ? 'A que horas você acorda?' : 'What time do you wake up?',
          confidence: 1
        },
        {
          id: 'demo-c-t-2',
          speaker: 'student',
          occurredAt: new Date(s3Start.getTime() + 15_000).toISOString(),
          text: pt
            ? 'Eu acordo às sete e meia da manhã.'
            : 'I wake up at seven thirty in the morning.',
          confidence: 0.86
        }
      ],
      corrections: [
        {
          id: 'demo-c-c-1',
          turnId: 'demo-c-t-2',
          before: pt ? 'sete e meia' : 'seven thirty',
          after: pt ? 'sete e trinta' : 'seven thirty a.m.',
          note: pt
            ? 'Use "a.m." para horários matinais em inglês formal.'
            : 'Use "a.m." for morning times in formal English.'
        }
      ],
      pronunciationDeltas: [],
      durationSeconds: 15 * 60,
      score: 0.71
    }
  ];
}
