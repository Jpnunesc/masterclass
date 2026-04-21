import { TestBed } from '@angular/core/testing';

import type { Material } from '../domain/material.types';
import { MaterialDetailComponent } from './material-detail.component';

const PREVIEW_NOTICE = 'Preview version — full multiple-choice questions arrive in the next release.';

function exerciseMaterial(
  questions: ReadonlyArray<{ choices: readonly string[]; answerIndex: number }>
): Material {
  return {
    id: 'm1',
    studentId: 's1',
    kind: 'exercise',
    level: 'B1',
    topic: 'grammar',
    locale: 'en',
    title: 'Past simple drills',
    summary: 'Quick practice',
    body: {
      kind: 'exercise',
      questions: questions.map((q, i) => ({
        prompt: `Question ${i + 1}`,
        choices: q.choices,
        answerIndex: q.answerIndex
      }))
    },
    promptHash: 'h',
    version: 1,
    generatedAt: '2026-04-21T00:00:00.000Z',
    viewedAt: null,
    favorite: false,
    estimatedMinutes: 5
  };
}

function mount(material: Material) {
  const fixture = TestBed.createComponent(MaterialDetailComponent);
  fixture.componentRef.setInput('material', material);
  fixture.componentRef.setInput('kindLabel', 'Exercise');
  fixture.componentRef.setInput('closeLabel', 'Close');
  fixture.componentRef.setInput('previewNoticeLabel', PREVIEW_NOTICE);
  fixture.detectChanges();
  return fixture;
}

describe('MaterialDetailComponent — degraded exercise preview notice (SEV-47)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MaterialDetailComponent] }).compileComponents();
  });

  it('renders the preview notice exactly once when any question has <= 2 choices', () => {
    const fixture = mount(
      exerciseMaterial([
        { choices: ['went', "I'm not sure"], answerIndex: 0 },
        { choices: ['ate', 'eaten', 'eating', 'eat'], answerIndex: 0 }
      ])
    );

    const notices: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll(
      '.mc-material-exercise-preview'
    );
    expect(notices.length).toBe(1);
    expect(notices[0].textContent?.trim()).toBe(PREVIEW_NOTICE);
  });

  it('does not render the notice when every question has > 2 choices', () => {
    const fixture = mount(
      exerciseMaterial([
        { choices: ['a', 'b', 'c', 'd'], answerIndex: 2 },
        { choices: ['x', 'y', 'z'], answerIndex: 0 }
      ])
    );

    const notice = fixture.nativeElement.querySelector('.mc-material-exercise-preview');
    expect(notice).toBeNull();
  });
});
