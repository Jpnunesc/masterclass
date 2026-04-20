import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
  computed,
  inject,
  input
} from '@angular/core';

import { AudioControllerService, type AudioButtonState } from '../audio-controller.service';

@Component({
  selector: 'mc-audio-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      type="button"
      class="mc-audio-btn"
      [class.mc-audio-btn--secondary]="variant === 'secondary'"
      [class.is-playing]="state() === 'playing'"
      [class.is-loading]="state() === 'loading'"
      [class.is-error]="state() === 'error'"
      [attr.aria-pressed]="state() === 'playing'"
      [attr.aria-label]="ariaLabel"
      (click)="toggle()"
      (keydown.space)="toggle(); $event.preventDefault()"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        @if (state() === 'playing') {
          <rect x="7" y="6" width="3.5" height="12" fill="currentColor" />
          <rect x="13.5" y="6" width="3.5" height="12" fill="currentColor" />
        } @else if (state() === 'loading') {
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" stroke-dasharray="14 34" fill="none">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite"/>
          </circle>
        } @else if (state() === 'error') {
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="16.5" r="1" fill="currentColor" />
        } @else {
          <path d="M8 5l11 7-11 7V5z" fill="currentColor" />
        }
      </svg>
    </button>
  `,
  styles: [
    `
      .mc-audio-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        padding: 0;
        background: var(--mc-accent-600);
        color: var(--mc-accent-ink);
        border: 0;
        border-radius: var(--mc-radius-pill);
        cursor: pointer;
        transition:
          background var(--mc-dur-2) var(--mc-ease-standard),
          color var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-audio-btn:hover:not(:disabled) { background: var(--mc-accent-700); }
      .mc-audio-btn:active:not(:disabled) { background: var(--mc-accent-800); }
      .mc-audio-btn--secondary {
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        border: 1px solid var(--mc-line-strong);
      }
      .mc-audio-btn:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 2px;
      }
      .mc-audio-btn.is-playing {
        background: var(--mc-accent-soft);
        color: var(--mc-ink);
        box-shadow: 0 0 0 6px color-mix(in srgb, var(--mc-accent-soft) 50%, transparent);
        animation: mc-audio-breathe var(--mc-dur-3) ease-in-out infinite alternate;
      }
      .mc-audio-btn.is-error {
        color: var(--mc-status-danger);
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-audio-btn.is-playing {
          animation: none;
          box-shadow: inset 0 0 0 2px var(--mc-accent);
        }
      }
      @keyframes mc-audio-breathe {
        from { transform: scale(1); }
        to { transform: scale(1.04); }
      }
    `
  ]
})
export class AudioButtonComponent {
  readonly id = input.required<string>();
  @Input({ required: true }) ariaLabel!: string;
  @Input() variant: 'primary' | 'secondary' = 'primary';

  private readonly audio = inject(AudioControllerService);
  protected readonly state = computed<AudioButtonState>(() =>
    this.audio.stateFor(this.id())
  );

  protected toggle(): void {
    if (this.state() === 'playing' || this.state() === 'loading') {
      this.audio.stop();
    } else {
      this.audio.start(this.id());
    }
  }
}
