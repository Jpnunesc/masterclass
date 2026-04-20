import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { inject } from '@angular/core';
import { I18nService } from '@shared/i18n';

@Component({
  selector: 'mc-app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mc-footer">
      <span class="mc-footer__copy">{{ i18n.t('common.footer.copyright') }}</span>
      <span class="mc-footer__sep" aria-hidden="true">·</span>
      <a class="mc-footer__link" href="/legal/terms">{{ i18n.t('common.footer.terms') }}</a>
      <span class="mc-footer__sep" aria-hidden="true">·</span>
      <a class="mc-footer__link" href="/legal/privacy">{{ i18n.t('common.footer.privacy') }}</a>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        border-block-start: 1px solid var(--mc-line);
        background: var(--mc-bg);
      }
      .mc-footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: var(--mc-space-2);
        max-width: var(--mc-shell-nav-max);
        margin-inline: auto;
        padding-inline: var(--mc-space-6);
        min-height: var(--mc-shell-footer-h);
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-footer__link {
        color: var(--mc-ink-muted);
        text-decoration: none;
        transition: color var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-footer__link:hover {
        color: var(--mc-ink);
      }
      .mc-footer__sep {
        color: var(--mc-ink-muted);
      }
    `
  ]
})
export class AppFooterComponent {
  @HostBinding('attr.role') readonly role = 'contentinfo';
  protected readonly i18n = inject(I18nService);
}
