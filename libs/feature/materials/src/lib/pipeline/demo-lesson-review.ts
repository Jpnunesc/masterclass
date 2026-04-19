import type { SupportedLocale } from '@shared/i18n';

import type { LessonReview } from '../domain/lesson-review.types';

/**
 * Stub demo review for any lessonId. Returns a consistent shape so the SEV-19
 * Lesson Review surface can be built and tested end-to-end without a live
 * content backend. When the backend lands, replace with an actual lookup.
 */
export function demoLessonReview(
  lessonId: string,
  locale: SupportedLocale
): LessonReview {
  const isPt = locale === 'pt-BR';
  return {
    lessonId,
    title: isPt
      ? 'Pedindo café como um nativo'
      : 'Ordering coffee like a local',
    dateISO: '2026-04-17T09:15:00Z',
    durationMinutes: 12,
    progress: 100,
    summary: isPt
      ? 'Você praticou pedir café em um café movimentado e ensaiou frases úteis para personalizar o pedido.'
      : "You practiced ordering coffee in a busy café and rehearsed useful phrases for customizing your order.",
    stats: {
      wordsSpoken: 312,
      newVocabCount: 4,
      reviewedVocabCount: 6
    },
    wins: isPt
      ? [
          'Pronúncia clara dos sons de th em "think".',
          'Usou "I\'d like" no lugar de "I want" naturalmente.'
        ]
      : [
          'Clear pronunciation of the th-sound in "think".',
          'Swapped "I want" for "I\'d like" naturally.'
        ],
    focus: isPt
      ? [
          'Lembrar o artigo "a" antes de substantivos contáveis.',
          'Usar "could" para pedidos educados em vez de "can".'
        ]
      : [
          'Remember the article "a" before countable nouns.',
          'Use "could" for polite requests instead of "can".'
        ],
    vocabulary: [
      {
        term: 'obstinate',
        ipa: '/ˈɒb.stɪ.nət/',
        gloss: isPt ? 'Teimoso, relutante em mudar.' : 'Stubborn; unwilling to change.',
        examples: [
          "She's obstinate when it comes to her morning coffee.",
          'The door was obstinate and refused to open.'
        ],
        translations: isPt
          ? ['Ela é teimosa quando se trata do café da manhã.', 'A porta estava teimosa e se recusou a abrir.']
          : undefined
      },
      {
        term: 'refill',
        ipa: '/ˈriː.fɪl/',
        gloss: isPt ? 'Encher novamente um recipiente.' : 'To fill something again.',
        examples: [
          'Could I get a refill on my coffee, please?',
          'They offer free refills until 11am.'
        ],
        translations: isPt
          ? ['Poderia reabastecer meu café, por favor?', 'Eles oferecem refil grátis até as 11.']
          : undefined
      },
      {
        term: 'customize',
        ipa: '/ˈkʌs.tə.maɪz/',
        gloss: isPt
          ? 'Ajustar algo conforme sua preferência.'
          : 'To adjust something to your preference.',
        examples: [
          'You can customize your latte with any milk.',
          'I like to customize how much sugar goes in.'
        ]
      }
    ],
    grammar: [
      {
        rule: isPt
          ? 'Use "could" para pedidos educados em perguntas.'
          : 'Use "could" for polite requests in questions.',
        examples: [
          'Could I have an oat-milk latte, please?',
          'Could we get the check when you have a moment?'
        ],
        hint: isPt
          ? 'Contraste: "can" também funciona, mas soa mais casual.'
          : 'Contrast: "can" works too, but sounds more casual.'
      },
      {
        rule: isPt
          ? 'Indefinite articles: "a" antes de consoantes, "an" antes de vogais.'
          : 'Indefinite articles: "a" before consonants, "an" before vowels.',
        examples: ['I\'ll have a cappuccino.', "She ordered an americano."]
      }
    ],
    corrections: [
      {
        studentLine: 'Can I have cappuccino?',
        correctedLine: 'Can I have a cappuccino?',
        teacherNote: isPt
          ? 'Substantivos contáveis precisam do artigo "a".'
          : 'Countable nouns need the article "a".'
      },
      {
        studentLine: "I want more milk please.",
        correctedLine: "Could I have more milk, please?",
        teacherNote: isPt
          ? '"Could I have" soa mais educado que "I want".'
          : '"Could I have" sounds more polite than "I want".'
      }
    ],
    transcript: [
      {
        id: 't-1',
        speaker: 'teacher',
        seconds: 5,
        text: 'Welcome back! Let\'s practice ordering at a café today. Ready to start?'
      },
      {
        id: 't-2',
        speaker: 'student',
        seconds: 9,
        text: 'Yes. I want to order a coffee.'
      },
      {
        id: 't-3',
        speaker: 'teacher',
        seconds: 14,
        text: 'Great — try "Could I have a coffee, please?" It\'s a little softer.'
      },
      {
        id: 't-4',
        speaker: 'student',
        seconds: 22,
        text: 'Could I have a coffee, please?'
      },
      {
        id: 't-5',
        speaker: 'teacher',
        seconds: 27,
        text: 'Perfect. Now what kind — latte, americano, cappuccino?'
      },
      {
        id: 't-6',
        speaker: 'student',
        seconds: 32,
        text: 'Can I have cappuccino?'
      },
      {
        id: 't-7',
        speaker: 'teacher',
        seconds: 37,
        text: 'Nice — remember the article: "Can I have a cappuccino?"'
      }
    ]
  };
}
