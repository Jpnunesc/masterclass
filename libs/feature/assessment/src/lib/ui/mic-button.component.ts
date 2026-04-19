import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type MicState = 'idle' | 'recording' | 'disabled';

@Component({
  selector: 'mc-mic-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="mc-mic"
      [attr.data-state]="state"
      [attr.aria-pressed]="state === 'recording'"
      [attr.aria-label]="label"
      [disabled]="state === 'disabled'"
      (click)="toggled.emit()"
    >
      <span class="mc-mic-icon" aria-hidden="true">
        <span class="mc-mic-bar mc-mic-bar--1"></span>
        <span class="mc-mic-bar mc-mic-bar--2"></span>
        <span class="mc-mic-bar mc-mic-bar--3"></span>
      </span>
      <span class="mc-mic-text">{{ caption }}</span>
    </button>
  `,
  styles: [
    `
      .mc-mic {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-3);
        padding: var(--mc-space-3) var(--mc-space-5);
        border-radius: var(--mc-radius-pill);
        border: 1px solid var(--mc-border-strong);
        background: var(--mc-surface-raised);
        color: var(--mc-text-primary);
        font: inherit;
        cursor: pointer;
        min-height: 2.75rem;
      }
      .mc-mic[data-state='recording'] {
        background: var(--mc-accent-strong, var(--mc-text-primary));
        color: var(--mc-surface-base);
      }
      .mc-mic[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .mc-mic:focus-visible {
        outline: 2px solid var(--mc-focus-ring);
        outline-offset: 2px;
      }
      .mc-mic-icon {
        display: inline-flex;
        align-items: end;
        gap: 0.2rem;
        height: 1.1rem;
      }
      .mc-mic-bar {
        width: 0.22rem;
        background: currentColor;
        border-radius: 0.2rem;
      }
      .mc-mic-bar--1 { height: 50%; }
      .mc-mic-bar--2 { height: 100%; }
      .mc-mic-bar--3 { height: 60%; }
      .mc-mic[data-state='recording'] .mc-mic-bar {
        animation: mc-mic-wave 0.9s ease-in-out infinite;
      }
      .mc-mic[data-state='recording'] .mc-mic-bar--2 { animation-delay: 0.15s; }
      .mc-mic[data-state='recording'] .mc-mic-bar--3 { animation-delay: 0.3s; }
      @media (prefers-reduced-motion: reduce) {
        .mc-mic[data-state='recording'] .mc-mic-bar { animation: none; }
      }
      @keyframes mc-mic-wave {
        0%, 100% { transform: scaleY(0.6); }
        50%      { transform: scaleY(1);   }
      }
    `
  ]
})
export class MicButtonComponent {
  @Input({ required: true }) state!: MicState;
  @Input({ required: true }) caption!: string;
  @Input({ required: true }) label!: string;
  @Output() readonly toggled = new EventEmitter<void>();
}
