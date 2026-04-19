import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import type { QuestionResponse } from '../domain/assessment.types';

@Component({
  selector: 'mc-transcript-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-transcript" [attr.aria-label]="label">
      @if (responses.length === 0) {
        <p class="mc-transcript-empty">{{ emptyLabel }}</p>
      } @else {
        <ol class="mc-transcript-list">
          @for (r of responses; track r.questionId) {
            <li class="mc-transcript-item">
              <span class="mc-transcript-meta">{{ r.mode === 'voice' ? voiceLabel : textLabel }}</span>
              <p class="mc-transcript-text">{{ r.transcript || dashLabel }}</p>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: [
    `
      .mc-transcript {
        border: 1px solid var(--mc-border-subtle);
        border-radius: var(--mc-radius-md);
        padding: var(--mc-space-4);
        background: var(--mc-surface-base);
        max-height: 16rem;
        overflow-y: auto;
      }
      .mc-transcript-empty {
        margin: 0;
        color: var(--mc-text-secondary);
        font-style: italic;
      }
      .mc-transcript-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: var(--mc-space-3);
      }
      .mc-transcript-item {
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-transcript-meta {
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .mc-transcript-text {
        margin: 0;
        color: var(--mc-text-primary);
      }
    `
  ]
})
export class TranscriptPanelComponent {
  @Input({ required: true }) responses!: readonly QuestionResponse[];
  @Input({ required: true }) label!: string;
  @Input({ required: true }) emptyLabel!: string;
  @Input({ required: true }) voiceLabel!: string;
  @Input({ required: true }) textLabel!: string;
  @Input({ required: true }) dashLabel!: string;
}
