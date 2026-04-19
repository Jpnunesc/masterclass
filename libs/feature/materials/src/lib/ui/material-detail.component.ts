import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import type { Material } from '../domain/material.types';

/**
 * Accessible modal-ish panel that renders the full body of the selected
 * material. Rendering is exhaustive over MaterialBody.kind so a new body type
 * is a compile error here.
 */
@Component({
  selector: 'mc-material-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-material-detail"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="material.title"
    >
      <header class="mc-material-detail-head">
        <p class="mc-caption">{{ kindLabel }} · {{ material.level }}</p>
        <h2 class="mc-display-sm mc-material-detail-title">{{ material.title }}</h2>
        <p class="mc-material-detail-summary">{{ material.summary }}</p>
        <button
          type="button"
          class="mc-btn mc-btn-secondary mc-material-detail-close"
          (click)="close.emit()"
        >
          {{ closeLabel }}
        </button>
      </header>

      @switch (material.body.kind) {
        @case ('lesson') {
          <div class="mc-material-sections">
            @for (section of material.body.sections; track section.heading) {
              <article class="mc-material-section">
                <h3 class="mc-heading-md">{{ section.heading }}</h3>
                <p>{{ section.body }}</p>
              </article>
            }
          </div>
        }
        @case ('vocabulary') {
          <dl class="mc-material-vocab">
            @for (card of material.body.cards; track card.term) {
              <div class="mc-material-vocab-card">
                <dt>{{ card.term }}</dt>
                <dd>
                  <span class="mc-material-vocab-translation">{{ card.translation }}</span>
                  <span class="mc-material-vocab-example">{{ card.example }}</span>
                </dd>
              </div>
            }
          </dl>
        }
        @case ('exercise') {
          <ol class="mc-material-exercises">
            @for (q of material.body.questions; track q.prompt; let i = $index) {
              <li class="mc-material-question">
                <p class="mc-material-question-prompt">{{ q.prompt }}</p>
                <ul class="mc-material-choices" role="list">
                  @for (choice of q.choices; track choice; let j = $index) {
                    <li
                      class="mc-material-choice"
                      [class.mc-material-choice-answer]="j === q.answerIndex"
                    >
                      {{ choice }}
                    </li>
                  }
                </ul>
                @if (q.explanation) {
                  <p class="mc-material-explanation">{{ q.explanation }}</p>
                }
              </li>
            }
          </ol>
        }
        @case ('summary') {
          <ul class="mc-material-bullets">
            @for (bullet of material.body.bullets; track bullet) {
              <li>{{ bullet }}</li>
            }
          </ul>
        }
      }
    </section>
  `,
  styles: [
    `
      .mc-material-detail {
        display: grid;
        gap: var(--mc-gap-stack);
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-xl);
        background: var(--mc-surface-raised);
        border: 1px solid var(--mc-border-subtle);
        box-shadow: var(--mc-elevation-3);
      }
      .mc-material-detail-head {
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-material-detail-title {
        margin: 0;
        font-family: var(--mc-font-display);
      }
      .mc-material-detail-summary {
        color: var(--mc-text-secondary);
        margin: 0;
      }
      .mc-material-detail-close {
        justify-self: start;
      }
      .mc-material-sections {
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-material-section {
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-material-vocab {
        display: grid;
        gap: var(--mc-gap-inline);
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
      }
      .mc-material-vocab-card {
        display: grid;
        gap: var(--mc-space-1);
        padding: var(--mc-space-3);
        border-radius: var(--mc-radius-md);
        background: var(--mc-surface-muted);
      }
      .mc-material-vocab-card dt {
        font-weight: 600;
        color: var(--mc-text-accent);
      }
      .mc-material-vocab-card dd {
        margin: 0;
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-material-vocab-translation {
        color: var(--mc-text-primary);
      }
      .mc-material-vocab-example {
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
        font-style: italic;
      }
      .mc-material-exercises {
        display: grid;
        gap: var(--mc-gap-stack);
        padding-inline-start: var(--mc-space-5);
      }
      .mc-material-question {
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-material-question-prompt {
        margin: 0;
        font-weight: 600;
      }
      .mc-material-choices {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-material-choice {
        padding-block: var(--mc-space-1);
        padding-inline: var(--mc-space-3);
        border-radius: var(--mc-radius-sm);
        background: var(--mc-surface-muted);
      }
      .mc-material-choice-answer {
        background: var(--mc-accent-100);
        color: var(--mc-text-accent);
        font-weight: 600;
      }
      .mc-material-explanation {
        margin: 0;
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-material-bullets {
        margin: 0;
        padding-inline-start: var(--mc-space-5);
        display: grid;
        gap: var(--mc-space-2);
        color: var(--mc-text-primary);
      }
    `
  ]
})
export class MaterialDetailComponent {
  @Input({ required: true }) material!: Material;
  @Input({ required: true }) kindLabel!: string;
  @Input({ required: true }) closeLabel!: string;

  @Output() close = new EventEmitter<void>();
}
