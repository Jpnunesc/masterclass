import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output
} from '@angular/core';

import { I18nService, type I18nKey } from '@shared/i18n';

import type { MicState } from './classroom.types';

@Component({
  selector: 'mc-mic-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="mc-mic"
      [attr.data-state]="state()"
      [attr.aria-label]="caption()"
      [attr.aria-pressed]="ariaPressed()"
      [disabled]="disabled()"
      (click)="onClick()"
    >
      <svg
        class="mc-mic__glyph"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        @switch (state()) {
          @case ('denied') {
            <path
              d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-.23 1.15l-1.5-1.5A1 1 0 0 0 13 11V6a1 1 0 0 0-2 0v2.59L5.46 3.05A3 3 0 0 1 12 3Zm6 9h2a8 8 0 0 1-6.67 7.88V21h-2.66v-1.12A8 8 0 0 1 4 12h2a6 6 0 0 0 3.12 5.25Zm-4.83 1.59L3.41 3.83 2 5.24l4.14 4.14V12a6 6 0 0 0 7.12 5.9l1.43 1.43A8 8 0 0 1 11.33 20H8.67v1h6.66v-1a8 8 0 0 0 5-2.13l1.24 1.24L23 17.76 13.17 7.93ZM11 14.08l-2-2V12a3 3 0 0 0 2 2.82Z"
              fill="currentColor"
            />
          }
          @case ('paused') {
            <path d="M9 6h2v12H9zM13 6h2v12h-2z" fill="currentColor" />
          }
          @case ('processing') {
            <circle
              cx="12"
              cy="12"
              r="8"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-dasharray="30 50"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                dur="1.5s"
                values="0 12 12;360 12 12"
                repeatCount="indefinite"
              />
            </circle>
          }
          @default {
            <path
              d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm6 9h2a8 8 0 0 1-6.67 7.88V22h-2.66v-2.12A8 8 0 0 1 4 12h2a6 6 0 0 0 12 0Z"
              fill="currentColor"
            />
          }
        }
      </svg>
      <span class="mc-mic__halo" aria-hidden="true"></span>
      <span class="mc-mic__amp" aria-hidden="true"></span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .mc-mic {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 999px;
        border: 1px solid var(--mc-line-strong);
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition:
          background-color var(--mc-dur-1) var(--mc-ease-standard),
          color var(--mc-dur-1) var(--mc-ease-standard),
          box-shadow var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-mic:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .mc-mic:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 3px;
      }
      .mc-mic__glyph {
        width: 28px;
        height: 28px;
      }
      .mc-mic__halo,
      .mc-mic__amp {
        position: absolute;
        inset: -8px;
        border-radius: 999px;
        pointer-events: none;
      }
      [data-state='armed'] {
        background: var(--mc-accent);
        color: var(--mc-accent-ink);
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.5);
      }
      [data-state='recording'] {
        background: var(--mc-accent);
        color: var(--mc-accent-ink);
      }
      /* TODO(SEV-18 §2.3): replace canned keyframe with AnalyserNode-driven stroke-width tween (2px→8px on live RMS). Breathing halo below stays. */
      [data-state='recording'] .mc-mic__amp {
        border: 2px solid rgba(204, 120, 92, 0.6);
        animation: mc-mic-amp 900ms var(--mc-ease-standard) infinite;
      }
      [data-state='recording'] .mc-mic__halo {
        border: 2px solid rgba(204, 120, 92, 0.25);
        animation: mc-mic-breathe 2s var(--mc-ease-standard) infinite;
      }
      [data-state='paused'] {
        background: var(--mc-accent);
        color: var(--mc-accent-ink);
        opacity: 0.7;
      }
      [data-state='processing'] {
        background: var(--mc-accent);
        color: var(--mc-accent-ink);
      }
      [data-state='error'] {
        background: var(--mc-status-danger);
        color: var(--mc-accent-on);
        animation: mc-mic-shake 120ms linear 2;
      }
      [data-state='denied'] {
        background: transparent;
        color: var(--mc-ink-muted);
        border-style: dashed;
      }
      @keyframes mc-mic-amp {
        0%, 100% {
          transform: scale(0.95);
          opacity: 0.3;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }
      @keyframes mc-mic-breathe {
        0%, 100% {
          opacity: 0.2;
        }
        50% {
          opacity: 0.7;
        }
      }
      @keyframes mc-mic-shake {
        0%, 100% {
          transform: translateX(0);
        }
        50% {
          transform: translateX(2px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-mic__halo,
        .mc-mic__amp {
          animation: none !important;
        }
      }
    `
  ]
})
export class MicButtonComponent {
  private readonly i18n = inject(I18nService);

  readonly state = input.required<MicState>();
  readonly toggle = output<void>();

  readonly disabled = computed(() => this.state() === 'processing');
  readonly ariaPressed = computed(() => {
    const s = this.state();
    return s === 'armed' || s === 'recording' || s === 'paused';
  });

  readonly caption = computed(() => {
    const key = `classroom.mic.${this.state()}` as I18nKey;
    return this.i18n.t(key);
  });

  onClick(): void {
    if (this.disabled()) return;
    this.toggle.emit();
  }
}
