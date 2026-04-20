import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { I18nService } from '@shared/i18n';
import { ToastService } from '@shared/ui';

import { ChangePasswordModalComponent } from './change-password-modal.component';
import { ProfileStateService } from './profile-state.service';

@Component({
  selector: 'mc-profile-account',
  standalone: true,
  imports: [FormsModule, ChangePasswordModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-profile-section"
      [attr.aria-labelledby]="titleId"
    >
      <header class="mc-profile-section__head">
        <p class="mc-profile-section__eyebrow">
          {{ i18n.t('profile.account.eyebrow') }}
        </p>
        <h2 class="mc-profile-section__title" [id]="titleId">
          {{ i18n.t('profile.account.title') }}
        </h2>
      </header>

      <div class="mc-profile-section__body">
        <div class="mc-field">
          <label [for]="nameId" class="mc-field__label">
            {{ i18n.t('profile.account.nameLabel') }}
          </label>
          <input
            #nameInput
            type="text"
            [id]="nameId"
            class="mc-field__input"
            autocomplete="name"
            maxlength="64"
            required
            [ngModel]="draftName()"
            (ngModelChange)="draftName.set($event)"
            (blur)="commitName()"
            (keydown.enter)="commitOnEnter($event)"
            [attr.aria-invalid]="nameError() !== null"
            [attr.aria-describedby]="nameError() ? nameErrorId : nameHelpId"
          />
          @if (nameError(); as err) {
            <p class="mc-field__error" [id]="nameErrorId">{{ err }}</p>
          } @else {
            <p class="mc-field__help" [id]="nameHelpId">
              {{ i18n.t('profile.account.nameHelp') }}
            </p>
          }
        </div>

        <dl class="mc-readonly">
          <dt class="mc-field__label">{{ i18n.t('profile.account.emailLabel') }}</dt>
          <dd class="mc-readonly__value">{{ state.email() }}</dd>
          <dd class="mc-readonly__note">
            {{ i18n.t('profile.account.emailReadonly') }}
          </dd>
        </dl>

        <div class="mc-password-row">
          <div class="mc-password-row__label">
            <p class="mc-field__label">{{ i18n.t('profile.account.passwordLabel') }}</p>
            <p class="mc-password-row__mask" aria-hidden="true">••••••••</p>
          </div>
          <button
            type="button"
            class="mc-btn mc-btn-secondary"
            (click)="openPasswordModal()"
          >
            {{ i18n.t('profile.account.changePassword') }}
          </button>
        </div>
      </div>

      <hr class="mc-profile-section__rule" aria-hidden="true" />
    </section>

    @if (passwordModalOpen()) {
      <mc-change-password-modal (closed)="closePasswordModal()" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-profile-section {
        display: block;
      }
      .mc-profile-section__head {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-profile-section__eyebrow {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-profile-section__title {
        margin: 0;
        font: var(--mc-type-display-md);
        letter-spacing: var(--mc-tracking-display);
        color: var(--mc-ink);
      }
      @media (max-width: 47.99rem) {
        .mc-profile-section__title { font: var(--mc-type-title); }
      }
      .mc-profile-section__body {
        margin-top: var(--mc-space-6);
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-6);
      }
      .mc-profile-section__rule {
        margin: var(--mc-space-12) 0 0;
        border: 0;
        border-top: 1px solid var(--mc-line);
      }
      .mc-field {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-field__label {
        margin: 0;
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
      }
      .mc-field__input:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 4px;
        border-radius: var(--mc-radius-sm);
      }
      .mc-field__help {
        margin: 0;
        font-size: var(--mc-fs-body-md);
        color: var(--mc-ink-muted);
      }
      .mc-field__error {
        margin: 0;
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-status-danger);
      }
      .mc-readonly {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-readonly__value {
        margin: 0;
        font-size: var(--mc-fs-body-lg);
        color: var(--mc-ink);
        user-select: text;
        min-height: 40px;
        display: flex;
        align-items: center;
      }
      .mc-readonly__note {
        margin: 0;
        font-size: var(--mc-fs-body-md);
        color: var(--mc-ink-muted);
      }
      .mc-password-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--mc-space-5);
        align-items: center;
      }
      @media (max-width: 47.99rem) {
        .mc-password-row {
          grid-template-columns: 1fr;
        }
        .mc-password-row .mc-btn {
          inline-size: 100%;
        }
      }
      .mc-password-row__label {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-password-row__mask {
        margin: 0;
        font-size: var(--mc-fs-body-lg);
        color: var(--mc-ink-muted);
        letter-spacing: 0.2em;
      }
    `
  ]
})
export class AccountSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(ProfileStateService);
  private readonly toasts = inject(ToastService);

  protected readonly titleId = 'mc-profile-account-title';
  protected readonly nameId = 'mc-profile-account-name';
  protected readonly nameHelpId = 'mc-profile-account-name-help';
  protected readonly nameErrorId = 'mc-profile-account-name-err';

  protected readonly draftName = signal(this.state.displayName());
  protected readonly nameAttempted = signal(false);
  protected readonly passwordModalOpen = signal(false);

  private readonly nameInput =
    viewChild<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly nameError = computed(() => {
    if (!this.nameAttempted()) return null;
    if (this.draftName().trim().length === 0) {
      return this.i18n.t('profile.account.nameRequired');
    }
    return null;
  });

  protected commitOnEnter(event: Event): void {
    event.preventDefault();
    (event.target as HTMLInputElement | null)?.blur();
  }

  protected async commitName(): Promise<void> {
    this.nameAttempted.set(true);
    const next = this.draftName().trim();
    const previous = this.state.displayName();
    if (next === previous) return;
    if (next.length === 0) {
      this.draftName.set(previous);
      return;
    }
    this.state.setDisplayName(next);
    try {
      await this.state.saveDisplayName(next);
      this.toasts.show({
        message: this.i18n.t('profile.toast.nameSaved'),
        variant: 'success'
      });
    } catch {
      this.state.setDisplayName(previous);
      this.draftName.set(previous);
      this.toasts.show({
        message: this.i18n.t('profile.toast.revertError', {
          field: this.i18n.t('profile.toast.fieldName.displayName')
        }),
        variant: 'error'
      });
    }
  }

  protected openPasswordModal(): void {
    this.passwordModalOpen.set(true);
  }

  protected closePasswordModal(): void {
    this.passwordModalOpen.set(false);
    queueMicrotask(() => this.nameInput()?.nativeElement.focus());
  }
}
