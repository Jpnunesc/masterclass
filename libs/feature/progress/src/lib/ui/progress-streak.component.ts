import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation
} from '@angular/core';

export interface StreakDay {
  readonly iso: string;
  readonly active: boolean;
  readonly today: boolean;
  readonly ariaLabel: string;
}

/**
 * Streak module: display-lg count + uppercase label + 14-day dot strip.
 * No card chrome — the screen reads as paper, wrapping in a raised card would
 * double up the paper-on-paper feel.
 */
@Component({
  selector: 'mc-progress-streak',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="mc-progress-streak" [attr.aria-labelledby]="labelId">
      <p class="mc-progress-streak__count">{{ count }}</p>
      <p class="mc-progress-streak__label" [id]="labelId">{{ label }}</p>
      <ul class="mc-progress-streak__dots" role="list">
        @for (day of days; track day.iso) {
          <li
            role="listitem"
            class="mc-progress-streak__dot"
            [class.mc-progress-streak__dot--active]="day.active"
            [class.mc-progress-streak__dot--today]="day.today"
            [attr.aria-label]="day.ariaLabel"
            [attr.title]="day.ariaLabel"
          ></li>
        }
      </ul>
      <p class="mc-progress-streak__range">{{ rangeLabel }}</p>
    </section>
  `,
  styles: [
    `
      .mc-progress-streak {
        display: grid;
        gap: 0;
      }
      .mc-progress-streak__count {
        margin: 0;
        color: var(--mc-ink);
        font: var(--mc-type-display-md);
        letter-spacing: var(--mc-tracking-display);
      }
      .mc-progress-streak__label {
        margin: var(--mc-space-2) 0 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .mc-progress-streak__dots {
        list-style: none;
        margin: var(--mc-space-4) 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mc-space-2);
      }
      .mc-progress-streak__dot {
        inline-size: 12px;
        block-size: 12px;
        border-radius: 50%;
        background: var(--mc-line-strong);
      }
      .mc-progress-streak__dot--active {
        background: var(--mc-accent);
      }
      .mc-progress-streak__dot--today {
        box-shadow:
          0 0 0 2px var(--mc-bg),
          0 0 0 4px var(--mc-ink);
      }
      .mc-progress-streak__range {
        margin: var(--mc-space-2) 0 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-sm);
        line-height: var(--mc-lh-normal);
      }
    `
  ]
})
export class ProgressStreakComponent {
  @Input({ required: true }) count!: number;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) days!: readonly StreakDay[];
  @Input({ required: true }) rangeLabel!: string;
  @Input({ required: true }) labelId!: string;
}
