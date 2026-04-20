import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import type { LessonSession, LessonSessionId } from '../domain/lesson-session.types';

export interface SessionListLabels {
  readonly listAria: string;
  readonly emptyLabel: string;
  readonly durationLabel: (seconds: number) => string;
  readonly dateLabel: (iso: string) => string;
  readonly topicLabel: (topic: string) => string;
  readonly openAriaLabel: (title: string) => string;
  readonly turnCountLabel: (count: number) => string;
}

@Component({
  selector: 'mc-session-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul
      class="mc-session-list"
      role="list"
      [attr.aria-label]="labels.listAria"
    >
      @for (session of sessions; track session.id) {
        <li class="mc-session-list-item">
          <button
            type="button"
            class="mc-session-list-button"
            [attr.aria-pressed]="session.id === selectedId"
            [attr.aria-label]="labels.openAriaLabel(summaryFor(session))"
            (click)="opened.emit(session.id)"
          >
            <header class="mc-session-list-head">
              <span class="mc-session-list-level">{{ session.levelAtTime }}</span>
              <span class="mc-session-list-topic">
                {{ labels.topicLabel(session.topic) }}
              </span>
            </header>
            <p class="mc-session-list-summary">{{ summaryFor(session) }}</p>
            <footer class="mc-session-list-meta">
              <span>{{ labels.dateLabel(session.completedAt) }}</span>
              <span>{{ labels.durationLabel(session.durationSeconds) }}</span>
              <span>{{ labels.turnCountLabel(session.transcript.length) }}</span>
            </footer>
          </button>
        </li>
      } @empty {
        <li class="mc-session-list-empty" role="status">
          {{ labels.emptyLabel }}
        </li>
      }
    </ul>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-session-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--mc-gap-inline); }
      .mc-session-list-item { margin: 0; }
      .mc-session-list-button {
        width: 100%;
        text-align: start;
        display: grid;
        gap: var(--mc-space-2);
        padding: var(--mc-pad-control-y) var(--mc-pad-control-x);
        border-radius: var(--mc-radius-md);
        border: 1px solid var(--mc-border-subtle);
        background: var(--mc-surface-canvas);
        color: inherit;
        cursor: pointer;
        font: inherit;
      }
      .mc-session-list-button:hover { border-color: var(--mc-border-strong); }
      .mc-session-list-button[aria-pressed='true'] {
        border-color: var(--mc-accent-500);
        background: var(--mc-surface-raised);
        box-shadow: var(--mc-elevation-1);
      }
      .mc-session-list-head {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-2);
      }
      .mc-session-list-level {
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-session-list-topic {
        font-size: var(--mc-fs-caption);
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
        color: var(--mc-text-secondary);
      }
      .mc-session-list-summary {
        margin: 0;
        color: var(--mc-text-primary);
        line-height: var(--mc-lh-body);
      }
      .mc-session-list-meta {
        display: inline-flex;
        gap: var(--mc-gap-inline);
        color: var(--mc-text-secondary);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-session-list-empty {
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-md);
        border: 1px dashed var(--mc-border-strong);
        background: var(--mc-surface-muted);
        color: var(--mc-text-secondary);
        text-align: center;
      }
    `
  ]
})
export class SessionListComponent {
  @Input({ required: true }) sessions: readonly LessonSession[] = [];
  @Input() selectedId: LessonSessionId | null = null;
  @Input({ required: true }) labels!: SessionListLabels;

  @Output() opened = new EventEmitter<LessonSessionId>();

  protected summaryFor(session: LessonSession): string {
    return session.summary.trim().length > 0
      ? session.summary
      : this.labels.topicLabel(session.topic);
  }
}
