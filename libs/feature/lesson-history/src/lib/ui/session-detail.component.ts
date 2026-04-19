import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import type { LessonSession } from '../domain/lesson-session.types';

import {
  SessionTranscriptComponent,
  type TranscriptLabels
} from './transcript-view.component';

export interface SessionDetailLabels {
  readonly sectionAria: string;
  readonly transcriptHeading: string;
  readonly pronunciationHeading: string;
  readonly pronunciationEmpty: string;
  readonly participantsHeading: string;
  readonly completedAtLabel: (iso: string) => string;
  readonly durationLabel: (seconds: number) => string;
  readonly topicLabel: (topic: string) => string;
  readonly closeLabel: string;
  readonly scoreLabel: (score: number) => string;
  readonly deltaUp: string;
  readonly deltaDown: string;
  readonly deltaFlat: string;
  readonly transcriptLabels: TranscriptLabels;
}

@Component({
  selector: 'mc-session-detail',
  standalone: true,
  imports: [SessionTranscriptComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-session-detail"
      role="region"
      [attr.aria-label]="labels.sectionAria"
    >
      <header class="mc-session-detail-head">
        <div>
          <p class="mc-caption">{{ labels.topicLabel(session.topic) }} · {{ session.levelAtTime }}</p>
          <h2 class="mc-heading-lg">{{ session.summary }}</h2>
          <p class="mc-session-detail-meta">
            <span>{{ labels.completedAtLabel(session.completedAt) }}</span>
            <span>{{ labels.durationLabel(session.durationSeconds) }}</span>
            <span>{{ labels.scoreLabel(session.score) }}</span>
          </p>
        </div>
        <button
          type="button"
          class="mc-btn mc-btn-ghost"
          (click)="closed.emit()"
        >
          {{ labels.closeLabel }}
        </button>
      </header>

      <section class="mc-session-participants" aria-labelledby="mc-session-participants-h">
        <h3 id="mc-session-participants-h" class="mc-heading-sm">
          {{ labels.participantsHeading }}
        </h3>
        <ul class="mc-session-participant-list">
          @for (participant of session.participants; track participant.displayName) {
            <li class="mc-session-participant-item">
              <span class="mc-session-participant-kind">{{ participant.kind === 'student' ? labels.transcriptLabels.studentLabel : labels.transcriptLabels.teacherLabel }}</span>
              <span class="mc-session-participant-name">{{ participant.displayName }}</span>
            </li>
          }
        </ul>
      </section>

      <section class="mc-session-transcript-wrapper" aria-labelledby="mc-session-transcript-h">
        <h3 id="mc-session-transcript-h" class="mc-heading-sm">
          {{ labels.transcriptHeading }}
        </h3>
        <mc-session-transcript
          [turns]="session.transcript"
          [corrections]="session.corrections"
          [labels]="labels.transcriptLabels"
        />
      </section>

      <section class="mc-session-pronunciation" aria-labelledby="mc-session-pronunciation-h">
        <h3 id="mc-session-pronunciation-h" class="mc-heading-sm">
          {{ labels.pronunciationHeading }}
        </h3>
        @if (session.pronunciationDeltas.length > 0) {
          <ul class="mc-session-pronunciation-list">
            @for (delta of session.pronunciationDeltas; track delta.phoneme) {
              <li class="mc-session-pronunciation-item">
                <span class="mc-session-pronunciation-phoneme">{{ phonemeLabel(delta.phoneme) }}</span>
                <span
                  class="mc-session-pronunciation-change"
                  [attr.data-direction]="directionFor(delta.scoreBefore, delta.scoreAfter)"
                >
                  {{ scoreTransition(delta.scoreBefore, delta.scoreAfter) }}
                  <span class="mc-session-pronunciation-tag">
                    {{ directionLabel(delta.scoreBefore, delta.scoreAfter) }}
                  </span>
                </span>
              </li>
            }
          </ul>
        } @else {
          <p class="mc-session-pronunciation-empty" role="status">
            {{ labels.pronunciationEmpty }}
          </p>
        }
      </section>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-session-detail {
        display: grid;
        gap: var(--mc-gap-stack);
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-raised);
        border: 1px solid var(--mc-border-subtle);
        box-shadow: var(--mc-elevation-1);
      }
      .mc-session-detail-head {
        display: flex;
        gap: var(--mc-gap-inline);
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .mc-session-detail-head h2 {
        margin: 0;
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-session-detail-meta {
        margin: var(--mc-space-2) 0 0 0;
        display: inline-flex;
        gap: var(--mc-gap-inline);
        color: var(--mc-text-muted);
        font-size: var(--mc-fs-body-sm);
        flex-wrap: wrap;
      }
      .mc-session-participants h3,
      .mc-session-transcript-wrapper h3,
      .mc-session-pronunciation h3 {
        margin: 0 0 var(--mc-space-2) 0;
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-session-participant-list,
      .mc-session-pronunciation-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-session-participant-item,
      .mc-session-pronunciation-item {
        display: inline-flex;
        gap: var(--mc-space-2);
        align-items: baseline;
      }
      .mc-session-participant-kind {
        font-size: var(--mc-fs-caption);
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
        color: var(--mc-text-muted);
      }
      .mc-session-participant-name { color: var(--mc-text-primary); }
      .mc-session-pronunciation-phoneme {
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-session-pronunciation-change {
        color: var(--mc-text-secondary);
      }
      .mc-session-pronunciation-change[data-direction='up'] { color: var(--mc-semantic-success); }
      .mc-session-pronunciation-change[data-direction='down'] { color: var(--mc-semantic-danger); }
      .mc-session-pronunciation-tag {
        margin-inline-start: var(--mc-space-2);
        font-size: var(--mc-fs-caption);
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
      }
      .mc-session-pronunciation-empty {
        padding: var(--mc-pad-control-y) var(--mc-pad-control-x);
        border-radius: var(--mc-radius-md);
        border: 1px dashed var(--mc-border-strong);
        background: var(--mc-surface-muted);
        color: var(--mc-text-secondary);
      }
    `
  ]
})
export class SessionDetailComponent {
  @Input({ required: true }) session!: LessonSession;
  @Input({ required: true }) labels!: SessionDetailLabels;

  @Output() closed = new EventEmitter<void>();

  protected formatScore(score: number): string {
    const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
    return `${pct}%`;
  }

  protected phonemeLabel(phoneme: string): string {
    return `/${phoneme}/`;
  }

  protected scoreTransition(before: number, after: number): string {
    return `${this.formatScore(before)} → ${this.formatScore(after)}`;
  }

  protected directionFor(before: number, after: number): 'up' | 'down' | 'flat' {
    if (after > before) return 'up';
    if (after < before) return 'down';
    return 'flat';
  }

  protected directionLabel(before: number, after: number): string {
    const dir = this.directionFor(before, after);
    if (dir === 'up') return this.labels.deltaUp;
    if (dir === 'down') return this.labels.deltaDown;
    return this.labels.deltaFlat;
  }
}
