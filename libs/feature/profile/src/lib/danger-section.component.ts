import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { Router } from '@angular/router';

import { I18nService } from '@shared/i18n';

import { DeleteAccountModalComponent } from './delete-account-modal.component';
import { ProfileStateService } from './profile-state.service';

@Component({
  selector: 'mc-profile-danger',
  standalone: true,
  imports: [DeleteAccountModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-profile-section"
      [attr.aria-labelledby]="titleId"
    >
      <header class="mc-profile-section__head">
        <p class="mc-profile-section__eyebrow">
          {{ i18n.t('profile.danger.eyebrow') }}
        </p>
        <h2 class="mc-profile-section__title" [id]="titleId">
          {{ i18n.t('profile.danger.title') }}
        </h2>
      </header>

      <div class="mc-profile-section__body">
        <div class="mc-danger-row">
          <div class="mc-danger-row__info">
            <p class="mc-danger-row__label">
              {{ i18n.t('profile.danger.signOutLabel') }}
            </p>
            <p class="mc-danger-row__help">
              {{ i18n.t('profile.danger.signOutHelp') }}
            </p>
          </div>
          <button
            type="button"
            class="mc-btn mc-btn-secondary"
            (click)="signOut()"
          >
            {{ i18n.t('profile.danger.signOut') }}
          </button>
        </div>

        <div class="mc-danger-row">
          <div class="mc-danger-row__info">
            <p class="mc-danger-row__label">
              {{ i18n.t('profile.danger.deleteLabel') }}
            </p>
            <p class="mc-danger-row__help">
              {{ i18n.t('profile.danger.deleteHelp') }}
            </p>
          </div>
          <button
            #deleteBtn
            type="button"
            class="mc-btn mc-btn-destructive"
            (click)="openDelete()"
          >
            {{ i18n.t('profile.danger.delete') }}
          </button>
        </div>
      </div>
    </section>

    @if (deleteOpen()) {
      <mc-delete-account-modal (closed)="closeDelete()" />
    }
  `,
  styles: [
    `
      :host {
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
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-display-md);
        font-weight: 400;
        line-height: var(--mc-lh-tight);
        letter-spacing: var(--mc-tracking-tight);
        color: var(--mc-ink);
      }
      @media (max-width: 47.99rem) {
        .mc-profile-section__title {
          font-size: var(--mc-fs-heading-lg);
        }
      }
      .mc-profile-section__body {
        margin-top: var(--mc-space-6);
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-5);
      }
      .mc-danger-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--mc-space-5);
        align-items: center;
      }
      @media (max-width: 47.99rem) {
        .mc-danger-row {
          grid-template-columns: 1fr;
        }
        .mc-danger-row .mc-btn {
          inline-size: 100%;
        }
      }
      .mc-danger-row__info {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-1);
      }
      .mc-danger-row__label {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-danger-row__help {
        margin: 0;
        font-size: var(--mc-fs-body-md);
        color: var(--mc-ink-muted);
      }
    `
  ]
})
export class DangerSectionComponent {
  protected readonly i18n = inject(I18nService);
  private readonly state = inject(ProfileStateService);
  private readonly router = inject(Router);

  protected readonly titleId = 'mc-profile-danger-title';
  protected readonly deleteOpen = signal(false);

  private readonly deleteBtn =
    viewChild<ElementRef<HTMLButtonElement>>('deleteBtn');

  protected async signOut(): Promise<void> {
    await this.state.signOut();
    await this.router.navigateByUrl('/auth?justSignedOut=1');
  }

  protected openDelete(): void {
    this.deleteOpen.set(true);
  }

  protected closeDelete(): void {
    this.deleteOpen.set(false);
    queueMicrotask(() => this.deleteBtn()?.nativeElement.focus());
  }
}
