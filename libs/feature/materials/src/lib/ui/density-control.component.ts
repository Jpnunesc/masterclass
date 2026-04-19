import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation
} from '@angular/core';

import { LIBRARY_DENSITIES, type LibraryDensity } from '../domain/lesson.types';

interface DensityOption {
  readonly value: LibraryDensity;
  readonly labelKey: string;
}

@Component({
  selector: 'mc-density-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="mc-density"
      role="radiogroup"
      [attr.aria-label]="ariaLabel"
    >
      @for (opt of options; track opt.value) {
        <button
          type="button"
          role="radio"
          class="mc-density__btn"
          [attr.aria-checked]="active === opt.value"
          [attr.aria-label]="labelFor(opt.value)"
          [class.is-active]="active === opt.value"
          [attr.data-density]="opt.value"
          (click)="select(opt.value)"
          (keydown.ArrowRight)="cycle(1, $event)"
          (keydown.ArrowLeft)="cycle(-1, $event)"
        >
          <svg
            class="mc-density__icon"
            viewBox="0 0 20 20"
            width="20"
            height="20"
            aria-hidden="true"
            focusable="false"
          >
            @if (opt.value === 'compact') {
              <line x1="4" y1="5.5" x2="16" y2="5.5" />
              <line x1="4" y1="9" x2="16" y2="9" />
              <line x1="4" y1="12.5" x2="16" y2="12.5" />
              <line x1="4" y1="16" x2="16" y2="16" />
            } @else if (opt.value === 'comfortable') {
              <line x1="4" y1="6" x2="16" y2="6" />
              <line x1="4" y1="10" x2="16" y2="10" />
              <line x1="4" y1="14" x2="16" y2="14" />
            } @else {
              <line x1="4" y1="7" x2="16" y2="7" />
              <line x1="4" y1="13" x2="16" y2="13" />
            }
          </svg>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .mc-density {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 4px;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-pill);
      }
      .mc-density__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        background: transparent;
        border: 0;
        border-radius: var(--mc-radius-pill);
        color: var(--mc-ink-muted);
        cursor: pointer;
        transition:
          background var(--mc-dur-2) var(--mc-ease-standard),
          color var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-density__btn:hover {
        color: var(--mc-ink);
      }
      .mc-density__btn.is-active {
        background: var(--mc-accent-soft);
        color: var(--mc-ink);
      }
      .mc-density__icon {
        stroke: currentColor;
        stroke-width: 1.5;
        stroke-linecap: round;
        fill: none;
      }
    `
  ]
})
export class DensityControlComponent {
  @Input({ required: true }) active!: LibraryDensity;
  @Input({ required: true }) ariaLabel!: string;
  @Input({ required: true }) labelByDensity!: Readonly<Record<LibraryDensity, string>>;
  @Output() densityChange = new EventEmitter<LibraryDensity>();

  protected readonly options: readonly DensityOption[] = LIBRARY_DENSITIES.map((v) => ({
    value: v,
    labelKey: v
  }));

  protected labelFor(density: LibraryDensity): string {
    return this.labelByDensity[density];
  }

  protected select(density: LibraryDensity): void {
    if (this.active === density) return;
    this.densityChange.emit(density);
  }

  protected cycle(delta: 1 | -1, event: Event): void {
    event.preventDefault();
    const idx = LIBRARY_DENSITIES.indexOf(this.active);
    const next =
      LIBRARY_DENSITIES[(idx + delta + LIBRARY_DENSITIES.length) % LIBRARY_DENSITIES.length];
    this.select(next);
  }
}
