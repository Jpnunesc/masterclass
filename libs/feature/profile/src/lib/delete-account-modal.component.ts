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
import { Router } from '@angular/router';

import { I18nService } from '@shared/i18n';

import { ProfileStateService } from './profile-state.service';

@Component({
  selector: 'mc-delete-account-modal',
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
          {{ i18n.t('profile.danger.modalTitle') }}
        </h2>

        <p class="mc-modal__body">
          {{ i18n.t('profile.danger.modalWhat') }}
        </p>
        <p class="mc-modal__body">
          {{ i18n.t('profile.danger.modalWhen') }}
        </p>

        <div class="mc-field">
          <label [for]="confirmId" class="mc-field__label">
            {{ i18n.t('profile.danger.modalConfirmLabel') }}
          </label>
          <input
            #confirmInput
            type="text"
            [id]="confirmId"
            class="mc-field__input"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            [attr.placeholder]="state.email()"
            [attr.aria-describedby]="helpId"
            [ngModel]="typed()"
            (ngModelChange)="typed.set($event)"
          />
          <p class="mc-field__help" [id]="helpId">
            {{ i18n.t('profile.danger.modalConfirmHelp', { email: state.email() }) }}
          </p>
        </div>

        @if (errorMessage()) {
          <p class="mc-modal__error" role="alert">
            {{ errorMessage() }}
          </p>
        }

        <footer class="mc-modal__footer">
          <button
            type="button"
            class="mc-btn mc-btn-ghost"
            (click)="emitCancel()"
          >
            {{ i18n.t('common.modal.cancel') }}
          </button>
          <button
            type="button"
            class="mc-btn mc-btn-destructive"
            [disabled]="!canDelete()"
            [attr.aria-disabled]="!canDelete()"
            (click)="submit()"
          >
            {{ i18n.t('profile.danger.modalDelete') }}
          </button>
        </footer>
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
      }
      .mc-modal {
        width: min(480px, 100%);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-lg);
        padding: var(--mc-space-8);
        box-shadow: 0 18px 42px rgba(31, 30, 29, 0.18);
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-5);
      }
      .mc-modal__title {
        margin: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-heading-lg);
        font-weight: 400;
        color: var(--mc-ink);
      }
      .mc-modal__body {
        margin: 0;
        font-size: var(--mc-fs-body-md);
        color: var(--mc-ink-muted);
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
      .mc-field__input::placeholder {
        color: var(--mc-ink-faint);
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
      .mc-modal__error {
        margin: 0;
        color: var(--mc-status-danger);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-modal__footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--mc-space-3);
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-modal-backdrop {
          animation: none;
        }
      }
    `
  ]
})
export class DeleteAccountModalComponent implements AfterViewInit {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(ProfileStateService);
  private readonly router = inject(Router);

  readonly closed = output<void>();

  protected readonly titleId = 'mc-delete-modal-title';
  protected readonly confirmId = 'mc-delete-confirm';
  protected readonly helpId = 'mc-delete-confirm-help';

  protected readonly typed = signal('');
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly confirmInput =
    viewChild<ElementRef<HTMLInputElement>>('confirmInput');
  private readonly dialogEl = viewChild<ElementRef<HTMLElement>>('dialog');

  protected readonly canDelete = computed(() => {
    if (this.submitting()) return false;
    return (
      this.typed().trim().toLowerCase() ===
      this.state.email().trim().toLowerCase()
    );
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => this.confirmInput()?.nativeElement.focus());
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.emitCancel();
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

  protected async submit(): Promise<void> {
    if (!this.canDelete()) return;
    this.submitting.set(true);
    this.errorMessage.set(null);
    try {
      await this.state.deleteAccount();
      await this.state.signOut();
      await this.router.navigateByUrl('/auth?justDeleted=1');
      this.closed.emit();
    } catch {
      this.errorMessage.set(this.i18n.t('profile.danger.modalError'));
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
