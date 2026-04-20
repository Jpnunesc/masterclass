import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';

import { I18nService, type I18nKey } from '@shared/i18n';

import type { ActivityKind } from './domain/lesson.types';
import { LessonService } from './lesson.service';
import type { AssessmentSkill } from '@feature/assessment';

/**
 * Lesson plan preview + progress panel. Reuses the classroom's avatar + mic
 * chrome via route-level integration — this component only renders the plan
 * contract so a teacher (or QA) can inspect what the F2 engine generated.
 *
 * Intentionally thin: live interaction happens inside
 * [SEV-18](/SEV/issues/SEV-18)'s classroom view, which now consumes
 * `LessonService`.
 */
@Component({
  selector: 'mc-lesson-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-lesson"
      [attr.aria-label]="i18n.t('lesson.preview.aria')"
    >
      <header class="mc-lesson__header">
        <p class="mc-lesson__kicker">{{ i18n.t('lesson.preview.kicker') }}</p>
        <h1 class="mc-lesson__title">{{ i18n.t('lesson.preview.title') }}</h1>
        <p class="mc-lesson__lead">{{ i18n.t('lesson.preview.lead') }}</p>
      </header>

      @if (plan(); as p) {
        <dl class="mc-lesson__meta">
          <div>
            <dt>{{ i18n.t('lesson.preview.level') }}</dt>
            <dd>{{ p.targetLevel }}</dd>
          </div>
          <div>
            <dt>{{ i18n.t('lesson.preview.estimate') }}</dt>
            <dd>{{ p.estMinutes }} {{ i18n.t('lesson.preview.minutes') }}</dd>
          </div>
          <div>
            <dt>{{ i18n.t('lesson.preview.activities_count') }}</dt>
            <dd>{{ p.activities.length }}</dd>
          </div>
        </dl>
        <ol class="mc-lesson__list">
          @for (a of p.activities; track a.id) {
            <li class="mc-lesson__item">
              <span class="mc-lesson__kind">{{ i18n.t(kindKey(a.kind)) }}</span>
              <span class="mc-lesson__skill">{{ i18n.t(skillKey(a.targetSkill)) }}</span>
              <span class="mc-lesson__level">{{ a.cefrLevel }}</span>
              <span class="mc-lesson__prompt">{{ i18n.t(a.promptKey) }}</span>
            </li>
          }
        </ol>
      } @else {
        <p class="mc-lesson__empty">{{ i18n.t('lesson.preview.empty') }}</p>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 64rem;
        margin-inline: auto;
        padding: var(--mc-space-6);
      }
      .mc-lesson__kicker {
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
        margin: 0 0 var(--mc-space-2);
      }
      .mc-lesson__title {
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-display-md);
        margin: 0 0 var(--mc-space-2);
      }
      .mc-lesson__lead {
        color: var(--mc-ink-muted);
        margin: 0 0 var(--mc-space-5);
      }
      .mc-lesson__meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
        gap: var(--mc-space-3);
        padding: var(--mc-space-4);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        margin-block-end: var(--mc-space-5);
      }
      .mc-lesson__meta dt {
        font-size: var(--mc-fs-caption);
        color: var(--mc-ink-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .mc-lesson__meta dd {
        margin: 0;
        font-weight: 600;
      }
      .mc-lesson__list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-lesson__item {
        display: grid;
        grid-template-columns: 6rem 6rem 3rem 1fr;
        gap: var(--mc-space-3);
        padding: var(--mc-space-3) var(--mc-space-4);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-sm);
      }
      .mc-lesson__kind {
        font-weight: 600;
      }
      .mc-lesson__skill {
        color: var(--mc-ink-muted);
      }
      .mc-lesson__level {
        font-variant-numeric: tabular-nums;
        color: var(--mc-accent);
      }
      .mc-lesson__prompt {
        color: var(--mc-ink);
      }
      .mc-lesson__empty {
        color: var(--mc-ink-muted);
        font-style: italic;
      }
      @media (max-width: 48rem) {
        .mc-lesson__item {
          grid-template-columns: 1fr;
          gap: var(--mc-space-1);
        }
      }
    `
  ]
})
export class LessonPreviewComponent {
  protected readonly i18n = inject(I18nService);
  private readonly lesson = inject(LessonService);

  protected readonly plan = computed(() => this.lesson.plan());

  protected kindKey(kind: ActivityKind): I18nKey {
    return `lesson.activity.kind.${kind}` as I18nKey;
  }

  protected skillKey(skill: AssessmentSkill): I18nKey {
    return `lesson.activity.skill.${skill}` as I18nKey;
  }
}
