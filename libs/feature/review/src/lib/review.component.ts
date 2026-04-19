import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';

import { LIVE_ANNOUNCER } from '@shared/a11y';
import { I18nService, type I18nKey } from '@shared/i18n';

import type {
  ReviewGrade,
  ReviewQueueEntry,
  ReviewSkill
} from './domain/review.types';
import { ReviewService } from './review.service';

const GRADES: readonly ReviewGrade[] = ['again', 'hard', 'good', 'easy'];

@Component({
  selector: 'mc-review',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-review mc-container mc-stack">
      <header class="mc-review-header">
        <p class="mc-caption">{{ i18n.t('review.kicker') }}</p>
        <h1 class="mc-display-md">{{ i18n.t('review.title') }}</h1>
        <p class="mc-body-lg mc-lead">{{ i18n.t('review.lead') }}</p>
      </header>

      @if (service.session().phase === 'idle') {
        <section class="mc-review-queue" aria-live="polite">
          <div class="mc-review-queue-stats">
            <span class="mc-caption">{{ queueStatsLabel() }}</span>
            <span class="mc-caption">{{ skillBreakdownLabel() }}</span>
          </div>

          @if (queueEntries().length > 0) {
            <ul
              class="mc-review-queue-list"
              [attr.aria-label]="i18n.t('review.queue.aria')"
            >
              @for (q of queueEntries(); track q.item.id) {
                <li class="mc-review-queue-item">
                  <span class="mc-review-skill-tag">
                    {{ skillLabel(q.item.skill) }}
                  </span>
                  <span class="mc-review-prompt">{{ q.item.prompt }}</span>
                  <span class="mc-caption mc-review-level">
                    {{ q.item.level }}
                  </span>
                </li>
              }
            </ul>
            <button
              type="button"
              class="mc-btn mc-btn-primary"
              (click)="start()"
            >
              {{ i18n.t('review.actions.start') }}
            </button>
          } @else {
            <p class="mc-review-empty" role="status">
              {{ i18n.t('review.empty') }}
            </p>
          }
        </section>
      }

      @if (service.session().phase === 'running') {
        <section class="mc-review-runner" [attr.aria-label]="runnerAria()">
          <p class="mc-caption">{{ sessionProgressLabel() }}</p>
          @if (service.currentEntry(); as current) {
            <article class="mc-review-card">
              <p class="mc-caption">{{ skillLabel(current.item.skill) }}</p>
              <p class="mc-display-sm">{{ current.item.prompt }}</p>
              @if (current.item.answer) {
                <p class="mc-body-md mc-review-answer">
                  {{ current.item.answer }}
                </p>
              }
            </article>

            <div
              class="mc-review-grades"
              role="group"
              [attr.aria-label]="i18n.t('review.grades.aria')"
            >
              @for (g of grades; track g) {
                <button
                  type="button"
                  class="mc-btn mc-btn-ghost mc-review-grade"
                  [attr.data-grade]="g"
                  (click)="grade(g)"
                >
                  {{ gradeLabel(g) }}
                </button>
              }
            </div>

            <div class="mc-review-controls">
              <button
                type="button"
                class="mc-btn mc-btn-text"
                (click)="snooze()"
              >
                {{ i18n.t('review.actions.snooze') }}
              </button>
              <button
                type="button"
                class="mc-btn mc-btn-text"
                (click)="skip()"
              >
                {{ i18n.t('review.actions.skip') }}
              </button>
              <button
                type="button"
                class="mc-btn mc-btn-text"
                (click)="markKnown()"
              >
                {{ i18n.t('review.actions.known') }}
              </button>
            </div>
          }
        </section>
      }

      @if (service.session().phase === 'completed') {
        <section class="mc-review-done" aria-live="polite">
          <p class="mc-display-sm">
            {{ i18n.t('review.done.title') }}
          </p>
          <p class="mc-body-md">{{ doneSummary() }}</p>
          <button type="button" class="mc-btn mc-btn-primary" (click)="again()">
            {{ i18n.t('review.actions.again') }}
          </button>
        </section>
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-review {
        padding-block: var(--mc-pad-section);
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-review-header {
        display: grid;
        gap: var(--mc-space-2);
        max-width: var(--mc-reading-max);
      }
      .mc-review-queue,
      .mc-review-runner,
      .mc-review-done {
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-muted);
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-review-queue-stats {
        display: flex;
        gap: var(--mc-gap-inline);
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .mc-review-queue-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: var(--mc-space-2);
        max-height: 24rem;
        overflow-y: auto;
      }
      .mc-review-queue-item {
        display: grid;
        grid-template-columns: 6rem 1fr auto;
        gap: var(--mc-gap-inline);
        align-items: center;
        padding: var(--mc-space-2) var(--mc-space-3);
        border-radius: var(--mc-radius-md);
        background: var(--mc-bg-raised);
      }
      .mc-review-skill-tag {
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: var(--mc-font-size-sm);
      }
      .mc-review-card {
        text-align: center;
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-bg-raised);
      }
      .mc-review-answer {
        margin-block-start: var(--mc-space-2);
        color: var(--mc-text-secondary);
      }
      .mc-review-grades {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--mc-gap-inline);
      }
      .mc-review-controls {
        display: flex;
        gap: var(--mc-gap-inline);
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .mc-review-empty {
        text-align: center;
        color: var(--mc-text-secondary);
      }
      @media (max-width: 32rem) {
        .mc-review-queue-item {
          grid-template-columns: 1fr;
        }
        .mc-review-grades {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `
  ]
})
export class ReviewComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(ReviewService);
  private readonly announcer = inject(LIVE_ANNOUNCER);

  protected readonly grades = GRADES;

  protected readonly queueEntries = computed<readonly ReviewQueueEntry[]>(
    () => this.service.queue()
  );

  protected readonly queueStatsLabel = computed(() =>
    this.i18n.t('review.queue.stats', {
      count: this.service.queueStats().total,
      minutes: this.service.queueStats().estimatedMinutes
    })
  );

  protected readonly skillBreakdownLabel = computed(() => {
    const skills = this.service.queueStats().skills;
    if (skills.length === 0) return this.i18n.t('review.queue.skills.none');
    const labeled = skills
      .map((s) => this.i18n.t(`review.skill.${s}` as I18nKey))
      .join(' · ');
    return this.i18n.t('review.queue.skills', { list: labeled });
  });

  protected readonly runnerAria = computed(() =>
    this.i18n.t('review.runner.aria')
  );

  protected readonly sessionProgressLabel = computed(() => {
    const s = this.service.session();
    return this.i18n.t('review.runner.progress', {
      current: Math.min(s.currentIndex + 1, s.queue.length),
      total: s.queue.length
    });
  });

  protected readonly doneSummary = computed(() => {
    const s = this.service.session();
    const graded = s.outcomes.length;
    return this.i18n.t('review.done.summary', {
      graded,
      total: s.queue.length
    });
  });

  start(): void {
    const next = this.service.startSession();
    this.announcer.announce(
      this.i18n.t('review.runner.started', { count: next.queue.length }),
      'polite'
    );
  }

  grade(grade: ReviewGrade): void {
    this.service.grade(grade);
    this.announceOutcome(grade);
  }

  snooze(): void {
    this.service.snooze();
    this.announcer.announce(this.i18n.t('review.announce.snoozed'), 'polite');
  }

  skip(): void {
    this.service.skip();
    this.announcer.announce(this.i18n.t('review.announce.skipped'), 'polite');
  }

  markKnown(): void {
    this.service.markKnown();
    this.announcer.announce(this.i18n.t('review.announce.known'), 'polite');
  }

  again(): void {
    this.service.resetSession();
  }

  skillLabel(skill: ReviewSkill): string {
    return this.i18n.t(`review.skill.${skill}` as I18nKey);
  }

  gradeLabel(grade: ReviewGrade): string {
    return this.i18n.t(`review.grade.${grade}` as I18nKey);
  }

  private announceOutcome(grade: ReviewGrade): void {
    this.announcer.announce(
      this.i18n.t('review.announce.graded', {
        grade: this.gradeLabel(grade)
      }),
      'polite'
    );
  }
}
