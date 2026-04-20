import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { I18nService, type I18nKey } from '@shared/i18n';

import { AvatarComponent } from './avatar.component';
import { MicButtonComponent } from './mic-button.component';
import type { AvatarState, MicState } from './classroom.types';

@Component({
  selector: 'mc-avatar-column',
  standalone: true,
  imports: [AvatarComponent, MicButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-avatar-col" aria-labelledby="mc-avatar-caption">
      <mc-avatar [state]="avatarState()" captionId="mc-avatar-caption" />

      <p
        class="mc-avatar-col__caption"
        id="mc-avatar-caption"
        [attr.data-mc-avatar-caption]="true"
        aria-live="polite"
      >
        {{ captionText() }}
      </p>

      <div class="mc-avatar-col__meta">
        <span class="mc-avatar-col__teacher">{{ i18n.t(teacherNameKey()) }}</span>
        <span class="mc-avatar-col__sep" aria-hidden="true">·</span>
        <span class="mc-avatar-col__lesson">{{ i18n.t(lessonTitleKey()) }}</span>
      </div>

      <div class="mc-avatar-col__mic">
        <mc-mic-button [state]="micState()" (toggle)="micToggle.emit()" />
        <p class="mc-avatar-col__hint">{{ i18n.t('classroom.hint.mic') }}</p>
      </div>

      <p class="mc-avatar-col__session-meta">
        {{ sessionMetaText() }}
      </p>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .mc-avatar-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--mc-space-4);
        height: 100%;
        padding: var(--mc-space-4) 0;
      }
      .mc-avatar-col__caption {
        min-height: 40px;
        margin: 0;
        padding-block: var(--mc-space-3);
        text-align: center;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
        transition: opacity var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-avatar-col__meta {
        display: inline-flex;
        align-items: baseline;
        gap: var(--mc-space-2);
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-ink-muted);
        max-width: 100%;
      }
      .mc-avatar-col__teacher {
        white-space: nowrap;
      }
      .mc-avatar-col__lesson {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .mc-avatar-col__sep {
        color: var(--mc-ink-faint);
      }
      .mc-avatar-col__mic {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--mc-space-2);
      }
      .mc-avatar-col__hint {
        margin: 0;
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-ink-faint);
      }
      .mc-avatar-col__session-meta {
        margin: 0;
        margin-block-start: auto;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-faint);
      }
      @media (max-width: 48rem) {
        .mc-avatar-col__hint {
          display: none;
        }
      }
    `
  ]
})
export class AvatarColumnComponent {
  protected readonly i18n = inject(I18nService);

  readonly avatarState = input.required<AvatarState>();
  readonly micState = input.required<MicState>();
  readonly teacherNameKey = input.required<I18nKey>();
  readonly lessonTitleKey = input.required<I18nKey>();
  readonly elapsedMinutes = input.required<number>();
  readonly level = input.required<string>();
  readonly micToggle = output<void>();

  readonly captionText = computed(() => {
    const key = `classroom.avatar.caption.${this.avatarState()}` as I18nKey;
    return this.i18n.t(key);
  });

  readonly sessionMetaText = computed(() =>
    this.i18n.t('classroom.session_meta', {
      elapsed: this.elapsedMinutes(),
      level: this.level()
    })
  );
}
