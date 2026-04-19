import {
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'mc-progress-streak-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="mc-progress-streak"
      role="group"
      [attr.aria-label]="ariaLabel"
    >
      <header class="mc-progress-streak-head">
        <p class="mc-caption mc-progress-streak-kicker">{{ kickerLabel }}</p>
        <h2 class="mc-display-sm mc-progress-streak-days">
          {{ streakLabel }}
        </h2>
      </header>
      <dl class="mc-progress-streak-meta">
        <div>
          <dt>{{ longestLabel }}</dt>
          <dd>{{ longestValue }}</dd>
        </div>
        <div>
          <dt>{{ lastActiveLabel }}</dt>
          <dd>{{ lastActiveValue }}</dd>
        </div>
        <div>
          <dt>{{ materialsLabel }}</dt>
          <dd>{{ materialsValue }}</dd>
        </div>
      </dl>
    </article>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-progress-streak {
        display: grid;
        gap: var(--mc-gap-stack);
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-raised);
        border: 1px solid var(--mc-border-subtle);
        box-shadow: var(--mc-elevation-1);
      }
      .mc-progress-streak-head {
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-progress-streak-kicker {
        margin: 0;
        color: var(--mc-text-accent);
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
      }
      .mc-progress-streak-days {
        margin: 0;
        font-family: var(--mc-font-display);
        color: var(--mc-text-primary);
      }
      .mc-progress-streak-meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--mc-gap-inline);
        margin: 0;
      }
      .mc-progress-streak-meta > div {
        display: grid;
        gap: var(--mc-space-1);
      }
      .mc-progress-streak-meta dt {
        font-size: var(--mc-fs-caption);
        color: var(--mc-text-muted);
        text-transform: uppercase;
        letter-spacing: var(--mc-tracking-wide);
      }
      .mc-progress-streak-meta dd {
        margin: 0;
        color: var(--mc-text-primary);
        font-weight: 500;
      }
    `
  ]
})
export class ProgressStreakCardComponent {
  @Input({ required: true }) ariaLabel!: string;
  @Input({ required: true }) kickerLabel!: string;
  @Input({ required: true }) streakLabel!: string;
  @Input({ required: true }) longestLabel!: string;
  @Input({ required: true }) longestValue!: string;
  @Input({ required: true }) lastActiveLabel!: string;
  @Input({ required: true }) lastActiveValue!: string;
  @Input({ required: true }) materialsLabel!: string;
  @Input({ required: true }) materialsValue!: string;
}
