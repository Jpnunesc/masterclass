import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '@shared/i18n';

@Component({
  selector: 'mc-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-home mc-container mc-stack">
      <p class="mc-caption">{{ i18n.t('home.kicker') }}</p>
      <h1 class="mc-display-lg">{{ i18n.t('home.title') }}</h1>
      <p class="mc-body-lg mc-lead">
        {{ i18n.t('home.lead') }}
      </p>
      <div class="mc-cluster">
        <a routerLink="/classroom" class="mc-btn mc-btn-primary">{{ i18n.t('home.start_class') }}</a>
        <a routerLink="/materials" class="mc-btn mc-btn-secondary">{{ i18n.t('home.browse_materials') }}</a>
      </div>
    </section>
  `,
  styles: [
    `
      .mc-home {
        max-width: var(--mc-reading-max);
        padding-block: var(--mc-pad-section);
      }
      .mc-lead {
        color: var(--mc-text-secondary);
        max-width: 36rem;
      }
    `
  ]
})
export class HomeComponent {
  protected readonly i18n = inject(I18nService);
}
