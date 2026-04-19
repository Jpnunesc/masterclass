import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { I18nService } from '@shared/i18n';

import { AccountSectionComponent } from './account-section.component';
import { DangerSectionComponent } from './danger-section.component';
import { PreferencesSectionComponent } from './preferences-section.component';
import { TeacherSectionComponent } from './teacher-section.component';

@Component({
  selector: 'mc-profile',
  standalone: true,
  imports: [
    AccountSectionComponent,
    TeacherSectionComponent,
    PreferencesSectionComponent,
    DangerSectionComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="mc-profile"
      data-density="comfortable"
      [attr.aria-labelledby]="titleId"
    >
      <header class="mc-profile__head">
        <p class="mc-profile__eyebrow">{{ i18n.t('profile.eyebrow') }}</p>
        <h1 class="mc-profile__title" [id]="titleId">
          {{ i18n.t('profile.title') }}
        </h1>
        <p class="mc-profile__subtitle">{{ i18n.t('profile.subtitle') }}</p>
      </header>

      <mc-profile-account />
      <mc-profile-teacher />
      <mc-profile-preferences />
      <mc-profile-danger />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-profile {
        max-width: 720px;
        margin: 0 auto;
        padding: var(--mc-space-8) var(--mc-space-5);
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-8);
      }
      @media (min-width: 64rem) {
        .mc-profile {
          padding: var(--mc-space-12) var(--mc-space-10);
          gap: var(--mc-space-12);
        }
      }
      .mc-profile__head {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-3);
      }
      .mc-profile__eyebrow {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-profile__title {
        margin: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-display-lg);
        font-weight: 400;
        line-height: var(--mc-lh-tight);
        letter-spacing: var(--mc-tracking-tight);
        color: var(--mc-ink);
      }
      @media (max-width: 47.99rem) {
        .mc-profile__title {
          font-size: var(--mc-fs-display-md);
        }
      }
      .mc-profile__subtitle {
        margin: 0;
        font-size: var(--mc-fs-body-lg);
        line-height: var(--mc-lh-normal);
        color: var(--mc-ink-muted);
        max-width: 44rem;
      }
    `
  ]
})
export class ProfileComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly titleId = 'mc-profile-title';
}
