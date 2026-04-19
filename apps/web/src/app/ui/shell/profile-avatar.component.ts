import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { I18nService } from '@shared/i18n';
import { inject } from '@angular/core';

@Component({
  selector: 'mc-profile-avatar-trigger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="mc-avatar"
      [attr.aria-label]="i18n.t('common.profile.menu')"
      (click)="openProfile.emit()"
    >
      @if (portraitUrl()) {
        <img
          class="mc-avatar__img"
          [attr.src]="portraitUrl()"
          [attr.alt]="i18n.t('common.profile.avatar_aria')"
        />
      } @else {
        <span class="mc-avatar__initial" aria-hidden="true">{{ initial() }}</span>
      }
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .mc-avatar {
        inline-size: 2rem;
        block-size: 2rem;
        padding: 0;
        border: 1px solid var(--mc-line-strong);
        border-radius: 50%;
        background: var(--mc-bg-inset);
        color: var(--mc-ink);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: border-color var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-avatar:hover {
        border-color: var(--mc-accent);
      }
      .mc-avatar__img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
      }
      .mc-avatar__initial {
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink);
      }
    `
  ]
})
export class ProfileAvatarTriggerComponent {
  readonly profileName = input<string | null>(null);
  readonly portraitUrl = input<string | null>(null);
  readonly openProfile = output<void>();

  protected readonly i18n = inject(I18nService);

  protected readonly initial = computed(() => {
    const name = this.profileName()?.trim() ?? '';
    if (!name) return '•';
    return name.charAt(0).toUpperCase();
  });
}
