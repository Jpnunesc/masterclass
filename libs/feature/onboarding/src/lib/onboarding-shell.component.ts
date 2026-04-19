import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

import { I18nService } from '@shared/i18n';
import { LanguageSelectorComponent } from '@shared/ui';

import { ProgressBreadcrumbComponent } from './progress-breadcrumb.component';
import type { StepKey } from './onboarding-state.service';

const PATH_TO_STEP: Record<string, StepKey> = {
  language: 'language',
  teacher: 'teacher',
  assessment: 'assessment'
};

@Component({
  selector: 'mc-onboarding-shell',
  standalone: true,
  imports: [RouterOutlet, LanguageSelectorComponent, ProgressBreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mc-ob-shell">
      <header class="mc-ob-shell__top" role="banner">
        <span class="mc-ob-shell__mark" role="img" [attr.aria-label]="i18n.t('common.brand.name')">
          <span class="mc-ob-shell__glyph" aria-hidden="true">{{ mark }}</span>
        </span>
        <mc-progress-breadcrumb class="mc-ob-shell__crumb" [current]="currentStep()" />
        <mc-language-selector layout="pill" class="mc-ob-shell__lang" />
      </header>

      <main class="mc-ob-shell__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      :host { display: block; min-height: 100dvh; background: var(--mc-bg); }
      .mc-ob-shell {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
      }
      .mc-ob-shell__top {
        height: 64px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--mc-space-4);
        padding-inline: var(--mc-space-6);
        background: var(--mc-bg);
        border-bottom: 1px solid var(--mc-line);
      }
      @media (max-width: 767px) {
        .mc-ob-shell__top { height: 56px; padding-inline: var(--mc-space-4); }
      }
      .mc-ob-shell__mark {
        display: inline-block;
        width: 2rem;
        height: 2.25rem;
      }
      .mc-ob-shell__glyph {
        display: block;
        font-family: var(--mc-font-display);
        font-size: 1.5rem;
        line-height: 1.5rem;
        text-align: center;
        color: var(--mc-ink);
        letter-spacing: -0.01em;
      }
      .mc-ob-shell__glyph::after {
        content: '';
        display: block;
        width: 1.25rem;
        height: 1px;
        margin: 0.2rem auto 0;
        background: var(--mc-ink);
      }
      .mc-ob-shell__crumb {
        justify-self: center;
      }
      .mc-ob-shell__lang {
        justify-self: end;
      }
      .mc-ob-shell__main {
        flex: 1;
        display: flex;
        justify-content: center;
        padding: 3rem 1.5rem 2rem;
      }
      @media (max-width: 767px) {
        .mc-ob-shell__main { padding: 2.5rem 1rem 1.5rem; }
      }
    `
  ]
})
export class OnboardingShellComponent {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  protected readonly mark = 'M';
  private readonly currentUrl = signal(this.router.url);

  protected readonly currentStep = computed<StepKey>(() => {
    const url = this.currentUrl();
    const segment = url.split('?')[0].split('/').pop() ?? '';
    return PATH_TO_STEP[segment] ?? 'language';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects));
  }
}
