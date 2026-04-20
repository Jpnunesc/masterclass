import type { LevelAssessedEvent } from '@feature/assessment';

import { generateCommunicativePlan } from './communicative-planner';

function buildEvent(overrides: Partial<LevelAssessedEvent> = {}): LevelAssessedEvent {
  return {
    schemaVersion: 1,
    type: 'LevelAssessed',
    assessmentId: 'assess-001',
    studentId: 'student-001',
    level: 'B1',
    score: 0.55,
    confidence: 0.7,
    skills: {
      listen: { level: 'B1', score: 0.6 },
      speak: { level: 'A2', score: 0.4 },
      read: { level: 'B1', score: 0.55 },
      write: { level: 'B1', score: 0.55 }
    },
    subScores: { grammar: 0.55, vocabulary: 0.5 },
    startedAt: '2026-04-20T00:00:00.000Z',
    completedAt: '2026-04-20T00:08:00.000Z',
    locale: 'en',
    ...overrides
  };
}

describe('generateCommunicativePlan', () => {
  const fixedNow = () => new Date('2026-04-20T12:00:00.000Z');

  it('produces an A1 plan scaffolded to the weakest skill', () => {
    const event = buildEvent({
      level: 'A1',
      score: 0.2,
      assessmentId: 'assess-a1',
      studentId: 'student-a1',
      skills: {
        listen: { level: 'A1', score: 0.25 },
        speak: { level: 'A1', score: 0.1 },
        read: { level: 'A1', score: 0.3 },
        write: { level: 'A1', score: 0.2 }
      }
    });
    const plan = generateCommunicativePlan({
      event,
      lessonId: 'lesson-a1',
      now: fixedNow
    });

    expect(plan.targetLevel).toBe('A1');
    expect(plan.activities.length).toBeGreaterThanOrEqual(8);
    expect(plan.activities[0].kind).toBe('warmup');
    expect(plan.activities.at(-1)?.kind).toBe('cooldown');
    const speakCount = plan.activities.filter((a) => a.targetSkill === 'speak').length;
    expect(speakCount).toBeGreaterThanOrEqual(2);
  });

  it('produces a B1 plan that covers all four skills', () => {
    const plan = generateCommunicativePlan({
      event: buildEvent(),
      lessonId: 'lesson-b1',
      now: fixedNow
    });
    const skills = new Set(plan.activities.map((a) => a.targetSkill));
    expect(skills.has('listen')).toBe(true);
    expect(skills.has('speak')).toBe(true);
    expect(skills.has('read')).toBe(true);
    expect(skills.has('write')).toBe(true);
    expect(plan.balance.speak).toBeGreaterThan(0);
    expect(plan.estMinutes).toBeGreaterThan(5);
  });

  it('produces a C1 plan at or near the assessed level', () => {
    const event = buildEvent({
      level: 'C1',
      score: 0.85,
      assessmentId: 'assess-c1',
      studentId: 'student-c1',
      skills: {
        listen: { level: 'C1', score: 0.9 },
        speak: { level: 'B2', score: 0.75 },
        read: { level: 'C1', score: 0.88 },
        write: { level: 'C1', score: 0.8 }
      }
    });
    const plan = generateCommunicativePlan({
      event,
      lessonId: 'lesson-c1',
      now: fixedNow
    });
    expect(plan.targetLevel).toBe('C1');
    const levels = new Set(plan.activities.map((a) => a.cefrLevel));
    expect([...levels].some((l) => l === 'C1' || l === 'C2' || l === 'B2')).toBe(true);
  });

  it('yields unique plans for two different A2 students', () => {
    const a = generateCommunicativePlan({
      event: buildEvent({
        level: 'A2',
        assessmentId: 'assess-a',
        studentId: 'student-a',
        skills: {
          listen: { level: 'A2', score: 0.5 },
          speak: { level: 'A1', score: 0.3 },
          read: { level: 'A2', score: 0.45 },
          write: { level: 'A2', score: 0.4 }
        }
      }),
      lessonId: 'lesson-a',
      now: fixedNow
    });
    const b = generateCommunicativePlan({
      event: buildEvent({
        level: 'A2',
        assessmentId: 'assess-b',
        studentId: 'student-b',
        skills: {
          listen: { level: 'A2', score: 0.4 },
          speak: { level: 'A2', score: 0.45 },
          read: { level: 'A1', score: 0.3 },
          write: { level: 'A2', score: 0.4 }
        }
      }),
      lessonId: 'lesson-b',
      now: fixedNow
    });
    expect(a.signature).not.toBe(b.signature);
  });

  it('is deterministic for the same inputs', () => {
    const event = buildEvent({ assessmentId: 'fixed-assess' });
    const a = generateCommunicativePlan({ event, lessonId: 'id', now: fixedNow });
    const b = generateCommunicativePlan({ event, lessonId: 'id', now: fixedNow });
    expect(a.signature).toBe(b.signature);
  });
});
