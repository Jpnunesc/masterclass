import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { I18nService } from '@shared/i18n';

import { ToastService } from './toast.service';

@Component({
  selector: 'mc-toast-region',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (current(); as toast) {
      <div
        class="mc-toast"
        [attr.data-variant]="toast.variant"
        [attr.role]="role()"
        [attr.aria-live]="liveness()"
      >
        <p class="mc-toast__msg">{{ toast.message }}</p>
        <button
          type="button"
          class="mc-toast__close"
          [attr.aria-label]="i18n.t('common.toast.dismiss')"
          (click)="dismiss(toast.id)"
        >
          <svg
            class="mc-toast__icon"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
            focusable="false"
          >
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset-inline: 0;
        bottom: var(--mc-space-5);
        display: flex;
        justify-content: center;
        pointer-events: none;
        z-index: 60;
      }
      .mc-toast {
        pointer-events: auto;
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-3);
        min-width: 18rem;
        max-inline-size: min(42rem, calc(100vw - var(--mc-space-6)));
        padding: var(--mc-space-3) var(--mc-space-4);
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-md);
        box-shadow: 0 6px 20px rgba(31, 30, 29, 0.08);
        animation: mc-toast-enter var(--mc-dur-2) var(--mc-ease-enter);
      }
      .mc-toast[data-variant='success'] {
        border-color: var(--mc-accent);
      }
      .mc-toast[data-variant='error'] {
        border-color: var(--mc-status-danger);
        color: var(--mc-ink);
      }
      .mc-toast__msg {
        margin: 0;
        font-size: var(--mc-fs-body-md);
        line-height: var(--mc-lh-normal);
      }
      .mc-toast__close {
        border: 0;
        background: transparent;
        color: var(--mc-ink-muted);
        font: inherit;
        font-size: var(--mc-fs-heading-md);
        line-height: 1;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        border-radius: var(--mc-radius-sm);
      }
      .mc-toast__close:hover,
      .mc-toast__close:focus-visible {
        color: var(--mc-ink);
        background: var(--mc-accent-soft);
      }
      .mc-toast__icon {
        stroke: currentColor;
        stroke-width: 1.5;
        stroke-linecap: round;
        fill: none;
      }
      @keyframes mc-toast-enter {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-toast {
          animation: none;
        }
      }
    `
  ]
})
export class ToastRegionComponent {
  protected readonly i18n = inject(I18nService);
  private readonly toasts = inject(ToastService);

  protected readonly current = this.toasts.current;

  protected readonly role = computed<'status' | 'alert'>(() =>
    this.current()?.variant === 'error' ? 'alert' : 'status'
  );

  protected readonly liveness = computed<'polite' | 'assertive'>(() =>
    this.current()?.variant === 'error' ? 'assertive' : 'polite'
  );

  protected dismiss(id: number): void {
    this.toasts.dismiss(id);
  }
}
