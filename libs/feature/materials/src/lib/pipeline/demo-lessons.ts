import type { LibraryLesson } from '../domain/lesson.types';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Deterministic demo library used by the SEV-19 Materials landing. Enough
 * breadth to exercise the three sections (in progress / saved / all) and the
 * CEFR + skill + tag filter dimensions. Timestamps are relative to a fixed
 * epoch so snapshot tests stay stable.
 */
export function demoLibraryLessons(now: number = Date.now()): readonly LibraryLesson[] {
  const daysAgo = (n: number): string => new Date(now - n * DAY).toISOString();
  return [
    {
      id: 'l-01',
      title: 'Ordering coffee like a local',
      level: 'A2',
      topic: 'Café talk',
      skill: 'speaking',
      tag: 'everyday',
      durationMinutes: 12,
      progress: 60,
      saved: true,
      completedAt: null,
      startedAt: daysAgo(1)
    },
    {
      id: 'l-02',
      title: 'Talking about your team at work',
      level: 'B1',
      topic: 'Workplace',
      skill: 'speaking',
      tag: 'business',
      durationMinutes: 18,
      progress: 30,
      saved: false,
      completedAt: null,
      startedAt: daysAgo(2)
    },
    {
      id: 'l-03',
      title: 'Present perfect vs past simple',
      level: 'B1',
      topic: 'Verb tenses',
      skill: 'grammar',
      tag: 'everyday',
      durationMinutes: 15,
      progress: 100,
      saved: true,
      completedAt: daysAgo(3),
      startedAt: daysAgo(3)
    },
    {
      id: 'l-04',
      title: 'Airport announcements — what you need to hear',
      level: 'A2',
      topic: 'Travel',
      skill: 'listening',
      tag: 'travel',
      durationMinutes: 10,
      progress: 100,
      saved: false,
      completedAt: daysAgo(5),
      startedAt: daysAgo(5)
    },
    {
      id: 'l-05',
      title: 'Negotiating a deadline',
      level: 'B2',
      topic: 'Workplace',
      skill: 'speaking',
      tag: 'business',
      durationMinutes: 20,
      progress: 0,
      saved: true,
      completedAt: null,
      startedAt: null
    },
    {
      id: 'l-06',
      title: 'Introducing yourself in a job interview',
      level: 'B2',
      topic: 'Interviews',
      skill: 'speaking',
      tag: 'interviews',
      durationMinutes: 16,
      progress: 0,
      saved: false,
      completedAt: null,
      startedAt: null
    },
    {
      id: 'l-07',
      title: 'Linking words that make you sound fluent',
      level: 'B1',
      topic: 'Discourse',
      skill: 'grammar',
      tag: 'everyday',
      durationMinutes: 14,
      progress: 0,
      saved: false,
      completedAt: null,
      startedAt: null
    },
    {
      id: 'l-08',
      title: 'Describing a chart in a presentation',
      level: 'B2',
      topic: 'Workplace',
      skill: 'speaking',
      tag: 'business',
      durationMinutes: 22,
      progress: 0,
      saved: false,
      completedAt: null,
      startedAt: null
    },
    {
      id: 'l-09',
      title: 'Reading a short news story',
      level: 'B1',
      topic: 'News',
      skill: 'reading',
      tag: 'academic',
      durationMinutes: 12,
      progress: 0,
      saved: false,
      completedAt: null,
      startedAt: null
    },
    {
      id: 'l-10',
      title: 'Writing a polite follow-up email',
      level: 'B1',
      topic: 'Email',
      skill: 'writing',
      tag: 'business',
      durationMinutes: 15,
      progress: 0,
      saved: false,
      completedAt: null,
      startedAt: null
    },
    {
      id: 'l-11',
      title: 'Small talk at a conference',
      level: 'B2',
      topic: 'Networking',
      skill: 'speaking',
      tag: 'business',
      durationMinutes: 11,
      progress: 0,
      saved: false,
      completedAt: null,
      startedAt: null
    },
    {
      id: 'l-12',
      title: 'Pronouncing th-sounds',
      level: 'A2',
      topic: 'Pronunciation',
      skill: 'pronunciation',
      tag: 'everyday',
      durationMinutes: 8,
      progress: 0,
      saved: false,
      completedAt: null,
      startedAt: null
    }
  ] as const;
}
