import {
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';

import type {
  SessionCorrection,
  TranscriptTurn
} from '../domain/lesson-session.types';

export interface TranscriptLabels {
  readonly studentLabel: string;
  readonly teacherLabel: string;
  readonly timeLabel: (iso: string) => string;
  readonly correctionHeading: string;
  readonly correctionEmpty: string;
  readonly correctionBefore: string;
  readonly correctionAfter: string;
}

@Component({
  selector: 'mc-session-transcript',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-session-transcript">
      <ol class="mc-session-turns" [attr.aria-label]="labels.studentLabel + ' / ' + labels.teacherLabel">
        @for (turn of turns; track turn.id) {
          <li
            class="mc-session-turn"
            [attr.data-speaker]="turn.speaker"
          >
            <header class="mc-session-turn-head">
              <span class="mc-session-turn-speaker">{{ speakerLabel(turn) }}</span>
              <time class="mc-session-turn-time" [attr.datetime]="turn.occurredAt">
                {{ labels.timeLabel(turn.occurredAt) }}
              </time>
            </header>
            <p class="mc-session-turn-text">{{ turn.text }}</p>
          </li>
        }
      </ol>

      <section class="mc-session-corrections" aria-labelledby="mc-session-corrections-h">
        <h3 id="mc-session-corrections-h" class="mc-heading-sm">
          {{ labels.correctionHeading }}
        </h3>
        @if (corrections.length > 0) {
          <ul class="mc-session-correction-list">
            @for (correction of corrections; track correction.id) {
              <li class="mc-session-correction-item">
                <div class="mc-session-correction-row">
                  <span class="mc-session-correction-tag">{{ labels.correctionBefore }}</span>
                  <span class="mc-session-correction-before">{{ correction.before }}</span>
                </div>
                <div class="mc-session-correction-row">
                  <span class="mc-session-correction-tag">{{ labels.correctionAfter }}</span>
                  <span class="mc-session-correction-after">{{ correction.after }}</span>
                </div>
                @if (correction.note) {
                  <p class="mc-session-correction-note">{{ correction.note }}</p>
                }
              </li>
            }
          </ul>
        } @else {
          <p class="mc-session-correction-empty" role="status">
            {{ labels.correctionEmpty }}
          </p>
        }
      </section>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-session-transcript {
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-session-turns {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--mc-gap-inline);
      }
      .mc-session-turn {
        display: grid;
        gap: var(--mc-space-1);
        padding: var(--mc-pad-control-y) var(--mc-pad-control-x);
        border-radius: var(--mc-radius-md);
        border: 1px solid var(--mc-border-subtle);
        background: var(--mc-surface-canvas);
      }
      .mc-session-turn[data-speaker='ai_teacher'] {
        background: var(--mc-surface-muted);
      }
      .mc-session-turn-head {
        display: inline-flex;
        gap: var(--mc-gap-inline);
        align-items: baseline;
      }
      .mc-session-turn-speaker {
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-session-turn-time {
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-session-turn-text {
        margin: 0;
        line-height: var(--mc-lh-body);
        color: var(--mc-text-primary);
      }
      .mc-session-corrections {
        display: grid;
        gap: var(--mc-gap-inline);
      }
      .mc-session-corrections h3 {
        margin: 0;
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-session-correction-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--mc-gap-inline);
      }
      .mc-session-correction-item {
        display: grid;
        gap: var(--mc-space-1);
        padding: var(--mc-pad-control-y) var(--mc-pad-control-x);
        border-radius: var(--mc-radius-md);
        background: var(--mc-surface-canvas);
        border: 1px solid var(--mc-border-subtle);
      }
      .mc-session-correction-row {
        display: inline-flex;
        gap: var(--mc-space-2);
        align-items: baseline;
      }
      .mc-session-correction-tag {
        font-size: var(--mc-fs-caption);
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
        color: var(--mc-text-secondary);
      }
      .mc-session-correction-before { color: var(--mc-text-secondary); text-decoration: line-through; }
      .mc-session-correction-after { color: var(--mc-text-primary); font-weight: 500; }
      .mc-session-correction-note {
        margin: 0;
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-session-correction-empty {
        padding: var(--mc-pad-control-y) var(--mc-pad-control-x);
        border-radius: var(--mc-radius-md);
        border: 1px dashed var(--mc-border-strong);
        background: var(--mc-surface-muted);
        color: var(--mc-text-secondary);
      }
    `
  ]
})
export class SessionTranscriptComponent {
  @Input({ required: true }) turns: readonly TranscriptTurn[] = [];
  @Input({ required: true }) corrections: readonly SessionCorrection[] = [];
  @Input({ required: true }) labels!: TranscriptLabels;

  protected speakerLabel(turn: TranscriptTurn): string {
    return turn.speaker === 'student'
      ? this.labels.studentLabel
      : this.labels.teacherLabel;
  }
}
