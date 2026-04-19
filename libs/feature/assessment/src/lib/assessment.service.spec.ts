import { TestBed } from '@angular/core/testing';

import { AssessmentService } from './assessment.service';
import { provideAssessmentStubs } from './clients/stub-clients';
import { isLevelAssessedEvent } from './domain/level-assessed.event';

describe('AssessmentService (contract)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...provideAssessmentStubs()] });
  });

  it('completes a full assessment via the stub judge and emits a valid LevelAssessed event', async () => {
    const svc = TestBed.inject(AssessmentService);
    await svc.start({ studentId: 'student-42' });

    let guard = 0;
    while (svc.state().phase === 'listening') {
      const current = svc.state().currentQuestion;
      if (!current) break;
      const transcript = transcriptAtLevel(current.targetLevel);
      await svc.submit(transcript, 'text');
      if (guard++ > 12) throw new Error('runaway assessment');
    }

    expect(svc.state().phase).toBe('completed');
    const event = svc.levelAssessedEvent('assessment-42');
    expect(event).not.toBeNull();
    expect(isLevelAssessedEvent(event)).toBe(true);
    expect(event!.studentId).toBe('student-42');
    expect(event!.assessmentId).toBe('assessment-42');
  });

  it('returns null for the event when the assessment has not completed', () => {
    const svc = TestBed.inject(AssessmentService);
    expect(svc.levelAssessedEvent('x')).toBeNull();
  });

  it('finishes within the acceptance budget (≤ 8 questions)', async () => {
    const svc = TestBed.inject(AssessmentService);
    await svc.start({ studentId: 'budget' });
    let asked = 0;
    while (svc.state().phase === 'listening') {
      const current = svc.state().currentQuestion;
      if (!current) break;
      await svc.submit(transcriptAtLevel(current.targetLevel), 'text');
      asked += 1;
      if (asked > 10) break;
    }
    expect(asked).toBeLessThanOrEqual(8);
  });
});

function transcriptAtLevel(level: string): string {
  switch (level) {
    case 'A1':
      return 'hi.';
    case 'A2':
      return 'I went to the park yesterday and I ate ice cream.';
    case 'B1':
      return 'Yesterday I went hiking with two friends and we saw a waterfall.';
    case 'B2':
      return 'Remote work offers flexibility but in-person collaboration remains valuable for brainstorming.';
    case 'C1':
      return 'Electric vehicles reduce local emissions; however, grid capacity and battery sourcing require careful analysis.';
    case 'C2':
      return 'The metaphor frames solitude as both refuge and constraint, reflecting the narrator\u2019s ambivalent search for meaning.';
    default:
      return 'a reasonable answer in english';
  }
}
