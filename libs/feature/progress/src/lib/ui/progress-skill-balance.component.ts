import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation
} from '@angular/core';

export interface SkillBar {
  readonly key: string;
  readonly label: string;
  readonly share: number; // 0..100 integer
  readonly ariaLabel: string;
}

/**
 * Skill balance: four stacked rows, each with a label / bar / percent value.
 * Track is line-strong, fill is ink — no accent colour per spec §6.3.
 */
@Component({
  selector: 'mc-progress-skill-balance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="mc-progress-skills" [attr.aria-labelledby]="eyebrowId">
      <p class="mc-progress-skills__eyebrow" [id]="eyebrowId">{{ eyebrow }}</p>
      <p class="mc-progress-skills__range">{{ range }}</p>

      <ul class="mc-progress-skills__list" role="list">
        @for (bar of bars; track bar.key) {
          <li class="mc-progress-skills__row">
            <span class="mc-progress-skills__name">{{ bar.label }}</span>
            <span
              class="mc-progress-skills__track"
              role="progressbar"
              [attr.aria-valuenow]="bar.share"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-label]="bar.ariaLabel"
            >
              <span
                class="mc-progress-skills__fill"
                [style.inline-size.%]="bar.share"
              ></span>
            </span>
            <span class="mc-progress-skills__value">{{ formatPercent(bar.share) }}</span>
          </li>
        }
      </ul>

      @if (empty) {
        <p class="mc-progress-skills__empty">{{ emptyLabel }}</p>
      }
    </section>
  `,
  styles: [
    `
      .mc-progress-skills {
        display: grid;
        gap: 0;
      }
      .mc-progress-skills__eyebrow {
        margin: 0 0 var(--mc-space-2);
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .mc-progress-skills__range {
        margin: 0 0 var(--mc-space-5);
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-sm);
        line-height: var(--mc-lh-normal);
      }
      .mc-progress-skills__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--mc-space-4);
      }
      .mc-progress-skills__row {
        display: grid;
        grid-template-columns: 120px minmax(0, 1fr) 48px;
        column-gap: var(--mc-space-4);
        align-items: center;
      }
      @media (max-width: 47.99rem) {
        .mc-progress-skills__row {
          grid-template-columns: minmax(100px, max-content) minmax(0, 1fr) 48px;
        }
      }
      .mc-progress-skills__name {
        font-family: var(--mc-font-body);
        font-size: 1.375rem; /* 22 */
        line-height: 1.27;
        color: var(--mc-ink);
      }
      .mc-progress-skills__track {
        position: relative;
        display: block;
        block-size: 8px;
        inline-size: 100%;
        background: var(--mc-line-strong);
        border-radius: var(--mc-radius-pill);
        overflow: hidden;
      }
      .mc-progress-skills__fill {
        position: absolute;
        inset: 0;
        inset-inline-end: auto;
        block-size: 8px;
        background: var(--mc-ink);
        border-radius: var(--mc-radius-pill);
      }
      .mc-progress-skills__value {
        text-align: end;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-progress-skills__empty {
        margin: var(--mc-space-4) 0 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-sm);
        line-height: var(--mc-lh-normal);
      }
    `
  ]
})
export class ProgressSkillBalanceComponent {
  @Input({ required: true }) eyebrow!: string;
  @Input({ required: true }) eyebrowId!: string;
  @Input({ required: true }) range!: string;
  @Input({ required: true }) bars!: readonly SkillBar[];
  @Input({ required: true }) empty!: boolean;
  @Input({ required: true }) emptyLabel!: string;

  protected formatPercent(share: number): string {
    return `${share}%`;
  }
}
