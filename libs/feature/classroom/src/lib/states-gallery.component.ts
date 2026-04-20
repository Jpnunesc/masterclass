import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { I18nService, type I18nKey } from '@shared/i18n';

import { AvatarComponent } from './avatar.component';
import { MicButtonComponent } from './mic-button.component';
import {
  AVATAR_STATES,
  MIC_STATES,
  type AvatarState,
  type MicState
} from './classroom.types';

/**
 * Visual regression surface for the 8 avatar states and 7 mic states per
 * [states-gallery](/SEV/issues/SEV-18#document-states-gallery). Rendered at
 * `/classroom/states-gallery` so UXDesigner can compare snapshots without
 * stepping through the live session.
 */
@Component({
  selector: 'mc-classroom-states-gallery',
  standalone: true,
  imports: [AvatarComponent, MicButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mc-gallery" [attr.aria-label]="i18n.t('classroom.gallery.title')">
      <header class="mc-gallery__head">
        <p class="mc-gallery__eyebrow">{{ i18n.t('classroom.gallery.eyebrow') }}</p>
        <h1 class="mc-gallery__title">{{ i18n.t('classroom.gallery.title') }}</h1>
      </header>

      <section class="mc-gallery__section" aria-labelledby="mc-gallery-avatar">
        <h2 id="mc-gallery-avatar" class="mc-gallery__heading">
          {{ i18n.t('classroom.gallery.avatar.heading') }}
        </h2>
        <div class="mc-gallery__grid">
          @for (state of avatarStates; track state) {
            <figure class="mc-gallery__card">
              <mc-avatar [state]="state" [captionId]="avatarCaptionId(state)" />
              <figcaption
                class="mc-gallery__caption"
                [id]="avatarCaptionId(state)"
              >
                <span class="mc-gallery__state">{{ state }}</span>
                <span>{{ avatarCaption(state) }}</span>
              </figcaption>
            </figure>
          }
        </div>
      </section>

      <section class="mc-gallery__section" aria-labelledby="mc-gallery-mic">
        <h2 id="mc-gallery-mic" class="mc-gallery__heading">
          {{ i18n.t('classroom.gallery.mic.heading') }}
        </h2>
        <div class="mc-gallery__grid mc-gallery__grid--mic">
          @for (state of micStates; track state) {
            <figure class="mc-gallery__card">
              <mc-mic-button [state]="state" />
              <figcaption class="mc-gallery__caption">
                <span class="mc-gallery__state">{{ state }}</span>
                <span>{{ micCaption(state) }}</span>
              </figcaption>
            </figure>
          }
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .mc-gallery {
        max-width: var(--mc-shell-nav-max);
        margin-inline: auto;
        padding: var(--mc-space-10) var(--mc-space-6);
        display: grid;
        gap: var(--mc-space-10);
      }
      .mc-gallery__head {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-gallery__eyebrow {
        margin: 0;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-gallery__title {
        margin: 0;
        font: var(--mc-type-display-sm);
        letter-spacing: var(--mc-tracking-display);
        color: var(--mc-ink);
      }
      .mc-gallery__section {
        display: grid;
        gap: var(--mc-space-6);
      }
      .mc-gallery__heading {
        margin: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-heading-lg);
        font-weight: 400;
        color: var(--mc-ink);
      }
      .mc-gallery__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--mc-space-5);
      }
      .mc-gallery__grid--mic {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      }
      .mc-gallery__card {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--mc-space-3);
        padding: var(--mc-space-4);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-lg);
      }
      .mc-gallery__caption {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-ink-muted);
        text-align: center;
      }
      .mc-gallery__state {
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink);
      }
    `
  ]
})
export class ClassroomStatesGalleryComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly avatarStates = AVATAR_STATES;
  protected readonly micStates = MIC_STATES;

  avatarCaption(state: AvatarState): string {
    return this.i18n.t(`classroom.avatar.caption.${state}` as I18nKey);
  }

  micCaption(state: MicState): string {
    return this.i18n.t(`classroom.mic.${state}` as I18nKey);
  }

  avatarCaptionId(state: AvatarState): string {
    return `mc-gallery-avatar-${state}`;
  }
}
