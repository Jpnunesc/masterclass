import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation
} from '@angular/core';

export interface RailBucketLabel {
  readonly code: string;
  readonly current: boolean;
}

/**
 * Level trajectory rail. A 4px track with five ticks (A1..C1), a filled
 * segment up to the student's current position, and a circular marker on
 * top. The visual markers are decorative; a progressbar role on the rail
 * itself carries the numeric progress for AT.
 */
@Component({
  selector: 'mc-progress-level-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="mc-progress-level">
      <p class="mc-progress-level__eyebrow">{{ eyebrowLabel }}</p>
      <p class="mc-progress-level__current">{{ currentLabel }}</p>

      <div
        class="mc-progress-level__rail"
        role="progressbar"
        [attr.aria-valuenow]="positionPct"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="railAriaLabel"
      >
        <span
          class="mc-progress-level__fill"
          [style.inline-size.%]="positionPct"
        ></span>
        @for (t of ticks; track $index) {
          <span
            class="mc-progress-level__tick"
            [style.inset-inline-start.%]="t"
            aria-hidden="true"
          ></span>
        }
        @if (!atCap) {
          <span
            class="mc-progress-level__next"
            [style.inset-inline-start.%]="nextPct"
            aria-hidden="true"
          ></span>
        }
        <span
          class="mc-progress-level__mark"
          [style.inset-inline-start.%]="positionPct"
          aria-hidden="true"
        ></span>
      </div>

      <ul class="mc-progress-level__labels" aria-hidden="true">
        @for (label of bucketLabels; track label.code) {
          <li
            class="mc-progress-level__label"
            [class.mc-progress-level__label--current]="label.current"
          >{{ label.code }}</li>
        }
      </ul>

      <p class="mc-progress-level__caption">{{ caption }}</p>
    </section>
  `,
  styles: [
    `
      .mc-progress-level {
        display: grid;
        gap: 0;
      }
      .mc-progress-level__eyebrow {
        margin: 0 0 var(--mc-space-2);
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .mc-progress-level__current {
        margin: 0;
        color: var(--mc-ink);
        font: var(--mc-type-display-sm);
        letter-spacing: var(--mc-tracking-display);
      }

      .mc-progress-level__rail {
        position: relative;
        block-size: 4px;
        inline-size: 100%;
        margin-block-start: var(--mc-space-4);
        background: var(--mc-line-strong);
        border-radius: var(--mc-radius-pill);
      }
      .mc-progress-level__fill {
        position: absolute;
        inset: 0;
        inset-inline-end: auto;
        block-size: 4px;
        background: var(--mc-accent);
        border-radius: var(--mc-radius-pill);
      }
      .mc-progress-level__tick {
        position: absolute;
        inline-size: 4px;
        block-size: 12px;
        background: var(--mc-line-strong);
        border-radius: 2px;
        inset-block-start: -4px;
        transform: translateX(-50%);
      }
      .mc-progress-level__next {
        position: absolute;
        inline-size: 2px;
        block-size: 16px;
        background: color-mix(in srgb, var(--mc-ink) 40%, transparent);
        inset-block-start: -6px;
        transform: translateX(-50%);
      }
      .mc-progress-level__mark {
        position: absolute;
        inline-size: 16px;
        block-size: 16px;
        border-radius: 50%;
        background: var(--mc-ink);
        border: 2px solid var(--mc-bg);
        inset-block-start: -6px;
        transform: translateX(-50%);
      }

      .mc-progress-level__labels {
        list-style: none;
        margin: var(--mc-space-3) 0 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
      }
      .mc-progress-level__label {
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-progress-level__label:nth-child(1) { text-align: start; }
      .mc-progress-level__label:nth-child(2),
      .mc-progress-level__label:nth-child(3),
      .mc-progress-level__label:nth-child(4) { text-align: center; }
      .mc-progress-level__label:nth-child(5) { text-align: end; }
      .mc-progress-level__label--current {
        color: var(--mc-ink);
      }

      .mc-progress-level__caption {
        margin: var(--mc-space-3) 0 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-sm);
        line-height: var(--mc-lh-normal);
      }
    `
  ]
})
export class ProgressLevelRailComponent {
  @Input({ required: true }) eyebrowLabel!: string;
  @Input({ required: true }) currentLabel!: string;
  @Input({ required: true }) caption!: string;
  @Input({ required: true }) railAriaLabel!: string;
  @Input({ required: true }) positionPct!: number;
  @Input({ required: true }) nextPct!: number;
  @Input({ required: true }) atCap!: boolean;
  @Input({ required: true }) bucketLabels!: readonly RailBucketLabel[];

  protected readonly ticks: readonly number[] = [0, 25, 50, 75, 100];
}
