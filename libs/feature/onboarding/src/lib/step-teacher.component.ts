import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChildren
} from '@angular/core';
import { Router } from '@angular/router';

import { I18nService, type I18nKey } from '@shared/i18n';

import { OnboardingStateService, type Teacher } from './onboarding-state.service';

interface TeacherCard {
  readonly id: Teacher;
  readonly nameKey: I18nKey;
  readonly introKey: I18nKey;
  readonly portraitAltKey: I18nKey;
}

const CARDS: readonly TeacherCard[] = [
  {
    id: 'ana',
    nameKey: 'onboarding.step2.teacher.ana.name',
    introKey: 'onboarding.step2.teacher.ana.intro',
    portraitAltKey: 'onboarding.step2.teacher.ana.portrait_alt'
  },
  {
    id: 'daniel',
    nameKey: 'onboarding.step2.teacher.daniel.name',
    introKey: 'onboarding.step2.teacher.daniel.intro',
    portraitAltKey: 'onboarding.step2.teacher.daniel.portrait_alt'
  }
];

@Component({
  selector: 'mc-step-teacher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-step">
      <p class="mc-step__eyebrow">{{ i18n.t('onboarding.step2.eyebrow') }}</p>
      <h1 class="mc-step__title" [id]="titleId">{{ i18n.t('onboarding.step2.title') }}</h1>
      <p class="mc-step__sub">{{ i18n.t('onboarding.step2.sub') }}</p>

      <div
        class="mc-teacher-grid"
        role="radiogroup"
        [attr.aria-labelledby]="titleId"
        [attr.aria-label]="i18n.t('onboarding.step2.group.aria')"
        (keydown)="onGroupKey($event)"
      >
        @for (card of cards; track card.id; let i = $index) {
          <button
            #card
            type="button"
            role="radio"
            class="mc-teacher-card"
            [class.mc-teacher-card--selected]="state.teacher() === card.id"
            [attr.aria-checked]="state.teacher() === card.id"
            [attr.aria-describedby]="introId(card.id)"
            [attr.tabindex]="tabindexFor(card.id, i)"
            [attr.data-index]="i"
            (click)="pick(card.id)"
          >
            <div
              class="mc-teacher-card__portrait"
              role="img"
              [attr.aria-label]="i18n.t(card.portraitAltKey)"
            >
              <span class="mc-teacher-card__monogram" aria-hidden="true">
                {{ i18n.t(card.nameKey).charAt(0) }}
              </span>
            </div>
            <h2 class="mc-teacher-card__name">{{ i18n.t(card.nameKey) }}</h2>
            <p class="mc-teacher-card__intro" [id]="introId(card.id)">
              {{ i18n.t(card.introKey) }}
            </p>
            @if (state.teacher() === card.id) {
              <span class="mc-teacher-card__selected">
                {{ i18n.t('onboarding.step2.selected') }}
              </span>
            }
          </button>
        }
      </div>

      <button
        type="button"
        class="mc-btn mc-btn-primary mc-step__cta"
        [disabled]="state.teacher() === null"
        [attr.aria-label]="state.teacher() ? null : i18n.t('onboarding.step2.continue.pending')"
        (click)="next()"
      >
        {{ continueLabel() }}
      </button>

      <button type="button" class="mc-step__back" (click)="back()">
        {{ i18n.t('onboarding.step2.back') }}
      </button>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-step {
        width: min(720px, 100vw - 48px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--mc-space-3);
      }
      @media (max-width: 767px) {
        .mc-step { width: calc(100vw - 32px); }
      }
      .mc-step__eyebrow {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: var(--mc-tracking-wide);
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-step__title {
        margin: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-display-lg);
        font-weight: 400;
        line-height: var(--mc-lh-tight);
        letter-spacing: var(--mc-tracking-tight);
        color: var(--mc-ink);
        text-align: center;
      }
      @media (max-width: 767px) {
        .mc-step__title { font-size: var(--mc-fs-display-md); }
      }
      .mc-step__sub {
        margin: 0;
        font-size: var(--mc-fs-body-lg);
        line-height: var(--mc-lh-normal);
        color: var(--mc-ink-muted);
        text-align: center;
      }
      .mc-teacher-grid {
        margin-top: var(--mc-space-8);
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 1fr;
        gap: var(--mc-space-6);
        width: 100%;
      }
      @media (max-width: 767px) {
        .mc-teacher-grid { grid-template-columns: 1fr; gap: var(--mc-space-4); }
      }
      .mc-teacher-card {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        text-align: left;
        padding: var(--mc-pad-card);
        border: 1px solid var(--mc-line);
        background: var(--mc-bg-raised);
        border-radius: var(--mc-radius-lg);
        color: var(--mc-ink);
        font: inherit;
        cursor: pointer;
        transition: background var(--mc-dur-2) var(--mc-ease-standard),
          border-color var(--mc-dur-2) var(--mc-ease-standard),
          transform var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-teacher-card:hover { border-color: var(--mc-line-strong); }
      .mc-teacher-card:active { transform: scale(0.99); }
      .mc-teacher-card--selected {
        background: var(--mc-accent-soft);
        border-color: var(--mc-line-strong);
      }
      .mc-teacher-card__portrait {
        aspect-ratio: 3 / 4;
        background: var(--mc-bg-inset);
        border-radius: var(--mc-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--mc-space-4);
      }
      .mc-teacher-card__monogram {
        font-family: var(--mc-font-display);
        font-size: 4rem;
        color: var(--mc-ink-muted);
        line-height: 1;
      }
      .mc-teacher-card__name {
        margin: 0;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-heading-md);
        font-weight: 500;
      }
      .mc-teacher-card__intro {
        margin: var(--mc-space-1) 0 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-md);
        line-height: var(--mc-lh-normal);
      }
      .mc-teacher-card__selected {
        margin-top: var(--mc-space-3);
        font-size: var(--mc-fs-caption);
        letter-spacing: var(--mc-tracking-wide);
        text-transform: uppercase;
        color: var(--mc-accent);
      }
      .mc-step__cta {
        margin-top: var(--mc-space-8);
        min-width: 240px;
      }
      .mc-step__back {
        background: transparent;
        border: 0;
        padding: 0;
        margin-top: var(--mc-space-3);
        color: var(--mc-text-link);
        font: inherit;
        font-size: var(--mc-fs-body-md);
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 0.2em;
      }
      .mc-step__back:hover { color: var(--mc-accent-600); }
    `
  ]
})
export class StepTeacherComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(OnboardingStateService);
  private readonly router = inject(Router);

  protected readonly cards = CARDS;
  protected readonly titleId = 'mc-ob-step2-title';

  private readonly cardEls = viewChildren<ElementRef<HTMLButtonElement>>('card');

  protected introId(id: Teacher): string {
    return `mc-ob-teacher-${id}-intro`;
  }

  protected tabindexFor(id: Teacher, index: number): number {
    const selected = this.state.teacher();
    if (selected === null) return index === 0 ? 0 : -1;
    return selected === id ? 0 : -1;
  }

  protected continueLabel(): string {
    const teacher = this.state.teacher();
    if (!teacher) return this.i18n.t('onboarding.step2.continue', { teacher: '—' });
    const card = CARDS.find((c) => c.id === teacher);
    const name = card ? this.i18n.t(card.nameKey) : '';
    return this.i18n.t('onboarding.step2.continue', { teacher: name });
  }

  protected pick(teacher: Teacher): void {
    this.state.setTeacher(teacher);
  }

  protected onGroupKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' &&
        event.key !== 'ArrowUp' && event.key !== 'ArrowDown' &&
        event.key !== ' ') return;
    const items = this.cardEls();
    if (items.length === 0) return;
    const current = this.state.teacher();
    const currentIdx = current === null ? 0 : this.cards.findIndex((c) => c.id === current);
    if (event.key === ' ') {
      event.preventDefault();
      this.pick(this.cards[currentIdx].id);
      return;
    }
    event.preventDefault();
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIdx = (currentIdx + delta + items.length) % items.length;
    this.pick(this.cards[nextIdx].id);
    items[nextIdx].nativeElement.focus();
  }

  protected next(): void {
    if (this.state.teacher() === null) return;
    void this.router.navigateByUrl('/onboarding/assessment');
  }

  protected back(): void {
    void this.router.navigateByUrl('/onboarding/language');
  }
}
