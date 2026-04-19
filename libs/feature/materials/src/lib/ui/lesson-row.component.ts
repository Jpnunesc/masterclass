import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
  computed,
  input
} from '@angular/core';

import type { LibraryLesson } from '../domain/lesson.types';

type RowAction = 'resume' | 'review' | 'open';

interface RowLabels {
  readonly duration: string;
  readonly progressAria: string;
  readonly actionByType: Readonly<Record<RowAction, string>>;
  readonly levelAria: (level: string) => string;
}

@Component({
  selector: 'mc-lesson-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <a
      class="mc-lesson-row"
      [attr.href]="'/materials/lesson/' + lesson().id"
      [attr.data-action]="action()"
      [attr.aria-label]="lesson().title + ' — ' + labels.actionByType[action()]"
    >
      <span
        class="mc-lesson-row__chip"
        [attr.aria-label]="labels.levelAria(lesson().level)"
      >
        {{ lesson().level }}
      </span>
      <span class="mc-lesson-row__body">
        <span class="mc-lesson-row__title">{{ lesson().title }}</span>
        <span class="mc-lesson-row__meta">
          {{ lesson().level }} · {{ lesson().topic }} · {{ skillLabel }}
        </span>
      </span>
      <span class="mc-lesson-row__end">
        <span class="mc-lesson-row__duration">{{ durationText }}</span>
        <span
          class="mc-lesson-row__progress"
          role="progressbar"
          [attr.aria-valuenow]="lesson().progress"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-label]="progressAria"
        >
          <span class="mc-lesson-row__progress-fill" [style.width.%]="lesson().progress"></span>
        </span>
      </span>
      <span class="mc-lesson-row__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          @if (action() === 'resume') {
            <path d="M5 4v16l6-8-6-8zm7 0v16l6-8-6-8z" fill="currentColor" />
          } @else if (action() === 'review') {
            <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          } @else {
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
          }
        </svg>
      </span>
    </a>
  `,
  styles: [
    `
      .mc-lesson-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        column-gap: var(--mc-space-4);
        align-items: center;
        padding: var(--mc-lesson-row-y, 12px) var(--mc-lesson-row-x, 16px);
        color: var(--mc-ink);
        text-decoration: none;
        border-bottom: 1px solid var(--mc-line);
        transition: background var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-lesson-row:last-of-type {
        border-bottom: 0;
      }
      .mc-lesson-row:hover,
      .mc-lesson-row:focus-visible {
        background: color-mix(in srgb, var(--mc-accent-soft) 60%, transparent);
      }
      .mc-lesson-row:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: -2px;
      }
      .mc-lesson-row__chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: var(--mc-lesson-chip-w, 40px);
        height: var(--mc-lesson-chip-h, 24px);
        padding: 0 var(--mc-space-2);
        background: var(--mc-accent-soft);
        color: var(--mc-ink);
        border-radius: var(--mc-radius-pill);
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .mc-lesson-row__body {
        display: grid;
        min-width: 0;
        gap: var(--mc-lesson-stack-gap, 2px);
      }
      .mc-lesson-row__title {
        font: var(--mc-fs-heading-sm) / var(--mc-lh-snug) var(--mc-font-body);
        font-weight: 600;
        overflow-wrap: anywhere;
      }
      .mc-lesson-row__meta {
        font: var(--mc-fs-body-sm) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
        overflow-wrap: anywhere;
      }
      .mc-lesson-row__end {
        display: grid;
        justify-items: end;
        gap: 6px;
        text-align: end;
      }
      .mc-lesson-row__duration {
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        color: var(--mc-ink-muted);
        letter-spacing: 0.04em;
      }
      .mc-lesson-row__progress {
        position: relative;
        display: block;
        height: 2px;
        width: var(--mc-lesson-progress-w, 120px);
        background: var(--mc-line);
        border-radius: var(--mc-radius-pill);
        overflow: hidden;
      }
      .mc-lesson-row__progress-fill {
        position: absolute;
        inset: 0;
        background: var(--mc-accent);
      }
      .mc-lesson-row__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--mc-lesson-icon-size, 40px);
        height: var(--mc-lesson-icon-size, 40px);
        color: var(--mc-ink-muted);
      }
      .mc-lesson-row:hover .mc-lesson-row__icon {
        color: var(--mc-accent);
      }

      /* Compact tightens paddings, narrows progress bar, and folds meta inline. */
      [data-density='compact'] .mc-lesson-row {
        --mc-lesson-row-y: 6px;
        --mc-lesson-row-x: 12px;
        --mc-lesson-progress-w: 80px;
        --mc-lesson-chip-w: 32px;
        --mc-lesson-chip-h: 22px;
        --mc-lesson-icon-size: 32px;
        --mc-lesson-stack-gap: 0;
      }
      [data-density='spacious'] .mc-lesson-row {
        --mc-lesson-row-y: 20px;
        --mc-lesson-row-x: 24px;
        --mc-lesson-progress-w: 160px;
        --mc-lesson-chip-w: 48px;
        --mc-lesson-chip-h: 28px;
        --mc-lesson-icon-size: 48px;
        --mc-lesson-stack-gap: 4px;
      }
    `
  ]
})
export class LessonRowComponent {
  readonly lesson = input.required<LibraryLesson>();
  @Input({ required: true }) labels!: RowLabels;
  @Input({ required: true }) skillLabel!: string;
  @Input({ required: true }) durationText!: string;
  @Input({ required: true }) progressAria!: string;

  protected readonly action = computed<RowAction>(() => {
    const p = this.lesson().progress;
    if (p >= 100) return 'review';
    if (p > 0) return 'resume';
    return 'open';
  });
}
