import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  output,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { I18nService } from '@shared/i18n';
import { ToastService } from '@shared/ui';

import { ProfileStateService } from './profile-state.service';

const MIN_PASSWORD = 8;

@Component({
  selector: 'mc-change-password-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mc-modal-backdrop"
      role="presentation"
      (click)="onBackdrop($event)"
    >
      <div
        #dialog
        class="mc-modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        (keydown)="onKey($event)"
      >
        <h2 class="mc-modal__title" [id]="titleId">
          {{ i18n.t('profile.password.modalTitle') }}
        </h2>

        <form class="mc-modal__form" (submit)="onSubmit($event)">
          <div class="mc-field">
            <label [for]="currentId" class="mc-field__label">
              {{ i18n.t('profile.password.currentLabel') }}
            </label>
            <input
              #current
              type="password"
              [id]="currentId"
              class="mc-field__input"
              autocomplete="current-password"
              [attr.aria-invalid]="currentError() !== null"
              [attr.aria-describedby]="currentError() ? currentErrId : null"
              [(ngModel)]="currentValue"
              name="current"
              required
            />
            @if (currentError(); as err) {
              <p class="mc-field__error" [id]="currentErrId">{{ err }}</p>
            }
          </div>

          <div class="mc-field">
            <label [for]="newId" class="mc-field__label">
              {{ i18n.t('profile.password.newLabel') }}
            </label>
            <input
              type="password"
              [id]="newId"
              class="mc-field__input"
              autocomplete="new-password"
              [attr.aria-invalid]="newError() !== null"
              [attr.aria-describedby]="newError() ? newErrId : newHelpId"
              [(ngModel)]="newValue"
              name="next"
              required
              minlength="8"
            />
            @if (newError(); as err) {
              <p class="mc-field__error" [id]="newErrId">{{ err }}</p>
            } @else {
              <p class="mc-field__help" [id]="newHelpId">
                {{ i18n.t('profile.password.minChars') }}
              </p>
            }
          </div>

          <div class="mc-field">
            <label [for]="confirmId" class="mc-field__label">
              {{ i18n.t('profile.password.confirmLabel') }}
            </label>
            <input
              type="password"
              [id]="confirmId"
              class="mc-field__input"
              autocomplete="new-password"
              [attr.aria-invalid]="confirmError() !== null"
              [attr.aria-describedby]="confirmError() ? confirmErrId : null"
              [(ngModel)]="confirmValue"
              name="confirm"
              required
            />
            @if (confirmError(); as err) {
              <p class="mc-field__error" [id]="confirmErrId">{{ err }}</p>
            }
          </div>

          <div class="mc-modal__footer">
            <button
              type="button"
              class="mc-btn mc-btn-ghost"
              (click)="emitCancel()"
            >
              {{ i18n.t('common.modal.cancel') }}
            </button>
            <button
              type="submit"
              class="mc-btn mc-btn-primary"
              [disabled]="submitting()"
            >
              {{ i18n.t('profile.password.modalSave') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-modal-backdrop {
        position: fixed;
        inset: 0;
        background: color-mix(in srgb, var(--mc-ink) 50%, transparent);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--mc-space-4);
        z-index: 50;
        animation: mc-modal-fade var(--mc-dur-2) var(--mc-ease-enter);
      }
      .mc-modal {
        width: min(480px, 100%);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-lg);
        box-shadow: 0 18px 42px rgba(31, 30, 29, 0.18);
        padding: var(--mc-space-8);
      }
      .mc-modal__title {
        margin: 0 0 var(--mc-space-5);
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-heading-lg);
        font-weight: 400;
        color: var(--mc-ink);
      }
      .mc-modal__form {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-5);
      }
      .mc-field {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-field__label {
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-field__input {
        border: 0;
        border-bottom: 1px solid var(--mc-line-strong);
        background: transparent;
        padding: var(--mc-space-2) 0;
        font: inherit;
        font-size: var(--mc-fs-body-lg);
        color: var(--mc-ink);
      }
      .mc-field__input:focus {
        outline: none;
        border-color: var(--mc-accent);
      }
      .mc-field__input:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 4px;
        border-radius: var(--mc-radius-sm);
      }
      .mc-field__help {
        margin: 0;
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-ink-muted);
      }
      .mc-field__error {
        margin: 0;
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-status-danger);
      }
      .mc-modal__footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--mc-space-3);
        margin-top: var(--mc-space-3);
      }
      @keyframes mc-modal-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-modal-backdrop {
          animation: none;
        }
      }
    `
  ]
})
export class ChangePasswordModalComponent implements AfterViewInit {
  protected readonly i18n = inject(I18nService);
  private readonly state = inject(ProfileStateService);
  private readonly toasts = inject(ToastService);

  readonly closed = output<void>();

  protected readonly titleId = 'mc-password-modal-title';
  protected readonly currentId = 'mc-password-current';
  protected readonly newId = 'mc-password-new';
  protected readonly confirmId = 'mc-password-confirm';
  protected readonly currentErrId = 'mc-password-current-err';
  protected readonly newErrId = 'mc-password-new-err';
  protected readonly newHelpId = 'mc-password-new-help';
  protected readonly confirmErrId = 'mc-password-confirm-err';

  protected readonly currentValue = signal('');
  protected readonly newValue = signal('');
  protected readonly confirmValue = signal('');
  protected readonly attempted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly serverMessage = signal<string | null>(null);

  private readonly currentInput =
    viewChild<ElementRef<HTMLInputElement>>('current');
  private readonly dialogEl =
    viewChild<ElementRef<HTMLElement>>('dialog');

  protected readonly currentError = computed(() => {
    if (!this.attempted()) return null;
    if (this.currentValue().length === 0) {
      return this.i18n.t('profile.password.currentWrong');
    }
    return this.serverMessage();
  });

  protected readonly newError = computed(() => {
    if (!this.attempted()) return null;
    if (this.newValue().length < MIN_PASSWORD) {
      return this.i18n.t('profile.password.minChars');
    }
    return null;
  });

  protected readonly confirmError = computed(() => {
    if (!this.attempted()) return null;
    if (this.confirmValue() !== this.newValue()) {
      return this.i18n.t('profile.password.mustMatch');
    }
    return null;
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => this.currentInput()?.nativeElement.focus());
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.emitCancel();
    }
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.emitCancel();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onDocEscape(event: KeyboardEvent): void {
    event.preventDefault();
    this.emitCancel();
  }

  protected emitCancel(): void {
    this.closed.emit();
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.attempted.set(true);
    this.serverMessage.set(null);
    if (this.currentError() || this.newError() || this.confirmError()) return;
    this.submitting.set(true);
    try {
      await this.state.savePassword(this.currentValue(), this.newValue());
      this.toasts.show({
        message: this.i18n.t('profile.toast.passwordSaved'),
        variant: 'success'
      });
      this.closed.emit();
    } catch {
      this.serverMessage.set(this.i18n.t('profile.password.currentWrong'));
    } finally {
      this.submitting.set(false);
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialogEl()?.nativeElement;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
