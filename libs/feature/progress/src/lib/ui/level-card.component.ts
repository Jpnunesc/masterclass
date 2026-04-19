import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal
} from '@angular/core';

import type { StudentProgressSnapshot } from '../domain/progress.types';
import { normalizedLevel } from '../pipeline/projections';

/**
 * Top-of-dashboard summary card. Displays the student's current CEFR level,
 * overall score, and tutor confidence. The `summaryLabel` is an
 * i18n-supplied screen-reader string so AT users hear the whole card at once
 * without walking the DOM.
 */
@Component({
  selector: 'mc-progress-level-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="mc-progress-level"
      role="group"
      [attr.aria-label]="ariaLabel"
    >
      <header class="mc-progress-level-head">
        <p class="mc-caption mc-progress-level-kicker">{{ kickerLabel }}</p>
        <h2 class="mc-display-lg mc-progress-level-value">
          {{ snapshot.level }}
        </h2>
      </header>
      <div class="mc-progress-level-metrics">
        <p class="mc-progress-level-summary">{{ summaryLabel }}</p>
        <dl class="mc-progress-level-stats">
          <div>
            <dt>{{ overallLabel }}</dt>
            <dd>{{ percent(snapshot.overallScore) }}</dd>
          </div>
          <div>
            <dt>{{ confidenceLabel }}</dt>
            <dd>{{ percent(snapshot.confidence) }}</dd>
          </div>
          <div>
            <dt>{{ lessonsLabel }}</dt>
            <dd>{{ snapshot.lessonsCompleted }}</dd>
          </div>
        </dl>
      </div>
      <div
        class="mc-progress-level-bar"
        role="meter"
        [attr.aria-label]="progressBarLabel"
        [attr.aria-valuenow]="barValue()"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span
          class="mc-progress-level-bar-fill"
          [style.inline-size.%]="barValue()"
        ></span>
      </div>
    </article>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-progress-level {
        display: grid;
        gap: var(--mc-gap-stack);
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-raised);
        border: 1px solid var(--mc-border-subtle);
        box-shadow: var(--mc-elevation-1);
      }
      .mc-progress-level-head {
        display: flex;
        align-items: baseline;
        gap: var(--mc-gap-inline);
      }
      .mc-progress-level-kicker {
        color: var(--mc-text-accent);
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
        margin: 0;
      }
      .mc-progress-level-value {
        margin: 0;
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-progress-level-metrics {
        display: grid;
        gap: var(--mc-space-3);
      }
      .mc-progress-level-summary {
        margin: 0;
        color: var(--mc-text-secondary);
        line-height: var(--mc-lh-body);
      }
      .mc-progress-level-stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--mc-gap-inline);
        margin: 0;
      }
      .mc-progress-level-stats > div {
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-progress-level-stats dt {
        font-size: var(--mc-fs-caption);
        color: var(--mc-text-muted);
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
      }
      .mc-progress-level-stats dd {
        margin: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-heading-md);
        color: var(--mc-text-primary);
      }
      .mc-progress-level-bar {
        position: relative;
        block-size: 0.5rem;
        border-radius: var(--mc-radius-pill);
        background: var(--mc-surface-muted);
        overflow: hidden;
      }
      .mc-progress-level-bar-fill {
        display: block;
        block-size: 100%;
        background: var(--mc-accent-500);
        transition: inline-size var(--mc-duration-3) var(--mc-ease-standard);
      }
    `
  ]
})
export class ProgressLevelCardComponent {
  private readonly snapshotSignal = signal<StudentProgressSnapshot | null>(null);

  @Input({ required: true })
  set snapshotValue(value: StudentProgressSnapshot) {
    this.snapshotSignal.set(value);
  }

  @Input({ required: true }) ariaLabel!: string;
  @Input({ required: true }) kickerLabel!: string;
  @Input({ required: true }) summaryLabel!: string;
  @Input({ required: true }) overallLabel!: string;
  @Input({ required: true }) confidenceLabel!: string;
  @Input({ required: true }) lessonsLabel!: string;
  @Input({ required: true }) progressBarLabel!: string;

  protected readonly barValue = computed(() => {
    const snap = this.snapshotSignal();
    if (!snap) return 0;
    return Math.round(normalizedLevel(snap.level) * 100);
  });

  get snapshot(): StudentProgressSnapshot {
    const current = this.snapshotSignal();
    if (!current) throw new Error('snapshot input not set');
    return current;
  }

  protected percent(score: number): string {
    return `${Math.round(clamp01(score) * 100)}%`;
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
