import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  computed,
  inject
} from '@angular/core';
import type { CefrLevel } from '@feature/assessment';
import { LIVE_ANNOUNCER } from '@shared/a11y';
import { I18nService, type I18nKey } from '@shared/i18n';

import type {
  LibraryDensity,
  LibraryFilter,
  LibraryLesson,
  LibrarySkill,
  LibraryTag
} from './domain/lesson.types';
import { LessonLibraryService } from './lesson-library.service';
import { DensityControlComponent } from './ui/density-control.component';
import {
  FilterChipsComponent,
  type FilterChipsLabels,
  type FilterChipsOptions,
  type FilterChipsState
} from './ui/filter-chips.component';
import { LessonRowComponent } from './ui/lesson-row.component';

const LEVEL_KEYS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const SKILL_KEYS: readonly LibrarySkill[] = [
  'speaking',
  'listening',
  'reading',
  'writing',
  'vocabulary',
  'grammar',
  'pronunciation'
] as const;
const TAG_KEYS: readonly LibraryTag[] = [
  'business',
  'travel',
  'everyday',
  'academic',
  'interviews'
] as const;

@Component({
  selector: 'mc-library',
  standalone: true,
  imports: [DensityControlComponent, FilterChipsComponent, LessonRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <main
      class="mc-library"
      [attr.data-density]="library.density()"
      [attr.aria-label]="i18n.t('materials.aria.main')"
      id="main"
    >
      <header class="mc-library__head">
        <p class="mc-library__eyebrow">{{ i18n.t('materials.eyebrow') }}</p>
        <h1 class="mc-library__title">{{ i18n.t('materials.title') }}</h1>
        <p class="mc-library__submeta">{{ submeta() }}</p>
      </header>

      <div class="mc-library__toolbar">
        <mc-filter-chips
          [labels]="filterLabels()"
          [options]="filterOptions()"
          [state]="filterState()"
          (levelToggled)="toggleLevel($event)"
          (skillToggled)="toggleSkill($event)"
          (tagToggled)="toggleTag($event)"
          (cleared)="clearFilters()"
        />
        <mc-density-control
          [active]="library.density()"
          [ariaLabel]="i18n.t('materials.density.aria.group')"
          [labelByDensity]="densityLabels()"
          (densityChange)="setDensity($event)"
        />
      </div>

      @if (inProgress().length > 0) {
        <section class="mc-library__section" aria-labelledby="mc-lib-sec-inprogress">
          <header class="mc-library__sec-head">
            <h2 id="mc-lib-sec-inprogress" class="mc-library__sec-title">
              {{ i18n.t('materials.sections.inProgress') }}
              <span class="mc-library__count">{{ countSuffix(inProgress().length) }}</span>
            </h2>
          </header>
          <ul class="mc-library__rows" role="list">
            @for (lesson of inProgress(); track lesson.id) {
              <li>
                <mc-lesson-row
                  [lesson]="lesson"
                  [labels]="rowLabels()"
                  [skillLabel]="skillLabel(lesson.skill)"
                  [durationText]="durationFor(lesson)"
                  [progressAria]="progressAria(lesson)"
                />
              </li>
            }
          </ul>
        </section>
      }

      <section class="mc-library__section" aria-labelledby="mc-lib-sec-saved">
        <header class="mc-library__sec-head">
          <h2 id="mc-lib-sec-saved" class="mc-library__sec-title">
            {{ i18n.t('materials.sections.saved') }}
            <span class="mc-library__count">{{ countSuffix(saved().length) }}</span>
          </h2>
        </header>
        @if (saved().length > 0) {
          <ul class="mc-library__rows" role="list">
            @for (lesson of saved(); track lesson.id) {
              <li>
                <mc-lesson-row
                  [lesson]="lesson"
                  [labels]="rowLabels()"
                  [skillLabel]="skillLabel(lesson.skill)"
                  [durationText]="durationFor(lesson)"
                  [progressAria]="progressAria(lesson)"
                />
              </li>
            }
          </ul>
        } @else {
          <div class="mc-library__empty">
            <p>{{ i18n.t('materials.empty.saved') }}</p>
          </div>
        }
      </section>

      <section class="mc-library__section" aria-labelledby="mc-lib-sec-all">
        <header class="mc-library__sec-head">
          <h2 id="mc-lib-sec-all" class="mc-library__sec-title">
            {{ i18n.t('materials.sections.all') }}
            <span class="mc-library__count">{{ countSuffix(filteredAll().length) }}</span>
          </h2>
          @if (library.canShowMore()) {
            <button
              type="button"
              class="mc-library__more"
              (click)="library.toggleShowAll()"
            >
              {{ library.showAll() ? i18n.t('materials.allLessons.showLess') : i18n.t('materials.allLessons.showMore') }}
            </button>
          }
        </header>
        @if (library.filtersActive()) {
          <p class="mc-library__scope-note">{{ i18n.t('materials.filter.scopeNote') }}</p>
        }
        @if (visibleAll().length > 0) {
          <ul class="mc-library__rows" role="list">
            @for (lesson of visibleAll(); track lesson.id) {
              <li>
                <mc-lesson-row
                  [lesson]="lesson"
                  [labels]="rowLabels()"
                  [skillLabel]="skillLabel(lesson.skill)"
                  [durationText]="durationFor(lesson)"
                  [progressAria]="progressAria(lesson)"
                />
              </li>
            }
          </ul>
        } @else {
          <div class="mc-library__empty">
            <p>
              {{ library.filtersActive()
                  ? i18n.t('materials.empty.filtered')
                  : i18n.t('materials.empty.all') }}
            </p>
            @if (library.filtersActive()) {
              <button
                type="button"
                class="mc-library__clear-link"
                (click)="clearFilters()"
              >{{ i18n.t('materials.filter.clear') }}</button>
            }
          </div>
        }
      </section>
    </main>
  `,
  styles: [
    `
      .mc-library {
        display: grid;
        gap: var(--mc-space-6);
        max-width: var(--mc-shell-nav-max);
        margin: 0 auto;
        padding: var(--mc-space-8) var(--mc-space-5);
      }
      @media (min-width: 1024px) {
        .mc-library {
          padding: var(--mc-space-10) var(--mc-space-10);
        }
      }
      .mc-library__head {
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-library__eyebrow {
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        color: var(--mc-ink-muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .mc-library__title {
        font: var(--mc-type-display-lg);
        letter-spacing: var(--mc-tracking-display);
        color: var(--mc-ink);
        margin: 0;
      }
      .mc-library__submeta {
        font: var(--mc-fs-body-sm) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
        margin: 0;
      }
      .mc-library__toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mc-space-4);
        align-items: flex-start;
        justify-content: space-between;
        padding: var(--mc-space-3) 0;
        border-bottom: 1px solid var(--mc-line);
      }
      .mc-library__section {
        display: grid;
        gap: var(--mc-space-3);
      }
      .mc-library__sec-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mc-space-3);
      }
      .mc-library__sec-title {
        display: inline-flex;
        align-items: baseline;
        gap: 8px;
        margin: 0;
        font: var(--mc-fs-heading-md) / var(--mc-lh-snug) var(--mc-font-body);
        color: var(--mc-ink);
      }
      .mc-library__count {
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        color: var(--mc-ink-muted);
        letter-spacing: 0.04em;
      }
      .mc-library__more {
        background: transparent;
        border: 0;
        padding: 0;
        color: var(--mc-accent-600, var(--mc-accent));
        cursor: pointer;
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .mc-library__scope-note {
        font: var(--mc-fs-body-sm) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
        margin: 0;
      }
      .mc-library__rows {
        list-style: none;
        margin: 0;
        padding: 0;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        overflow: hidden;
      }
      .mc-library__empty {
        padding: var(--mc-space-6);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        color: var(--mc-ink-muted);
      }
      .mc-library__clear-link {
        margin-top: var(--mc-space-3);
        background: transparent;
        border: 0;
        padding: 0;
        color: var(--mc-accent-600, var(--mc-accent));
        cursor: pointer;
        font: var(--mc-fs-body-sm) / 1 var(--mc-font-body);
      }
    `
  ]
})
export class LibraryComponent implements OnInit, OnDestroy {
  protected readonly i18n = inject(I18nService);
  protected readonly library = inject(LessonLibraryService);
  private readonly announcer = inject(LIVE_ANNOUNCER, { optional: true });
  private readonly doc = inject(DOCUMENT);

  protected readonly inProgress = this.library.inProgress;
  protected readonly saved = this.library.saved;
  protected readonly filteredAll = this.library.filteredAll;
  protected readonly visibleAll = this.library.visibleAll;

  protected readonly submeta = computed(() =>
    this.i18n.t('materials.submeta', {
      count: this.library.totalCount(),
      inProgress: this.library.inProgressCount()
    })
  );

  protected readonly filterOptions = computed<FilterChipsOptions>(() => ({
    levels: LEVEL_KEYS.map((v) => ({
      value: v,
      label: this.i18n.t(`materials.filter.level.${v}` as I18nKey)
    })),
    skills: SKILL_KEYS.map((v) => ({
      value: v,
      label: this.i18n.t(`materials.filter.skill.${v}` as I18nKey)
    })),
    tags: TAG_KEYS.map((v) => ({
      value: v,
      label: this.i18n.t(`materials.filter.tag.${v}` as I18nKey)
    }))
  }));

  protected readonly filterLabels = computed<FilterChipsLabels>(() => ({
    levelTrigger: this.i18n.t('materials.filter.level'),
    skillTrigger: this.i18n.t('materials.filter.skill'),
    tagTrigger: this.i18n.t('materials.filter.tag'),
    clearAll: this.i18n.t('materials.filter.clear'),
    scopeNote: this.i18n.t('materials.filter.scopeNote'),
    remove: (label: string) => this.i18n.t('common.remove', { label })
  }));

  protected readonly densityLabels = computed<Record<LibraryDensity, string>>(() => ({
    compact: this.i18n.t('materials.density.compact'),
    comfortable: this.i18n.t('materials.density.comfortable'),
    spacious: this.i18n.t('materials.density.spacious')
  }));

  protected readonly rowLabels = computed(() => ({
    duration: this.i18n.t('materials.row.duration', { minutes: 0 }),
    progressAria: this.i18n.t('materials.row.progressAria', { percent: 0 }),
    actionByType: {
      resume: this.i18n.t('materials.row.action.resume'),
      review: this.i18n.t('materials.row.action.review'),
      open: this.i18n.t('materials.row.action.open')
    },
    levelAria: (level: string) =>
      this.i18n.t('materials.card.level.aria', { level })
  }));

  protected filterState(): FilterChipsState {
    const f: LibraryFilter = this.library.filter();
    return { levels: f.levels, skills: f.skills, tags: f.tags };
  }

  ngOnInit(): void {
    this.doc.documentElement.setAttribute('data-library-route', 'true');
  }

  ngOnDestroy(): void {
    this.doc.documentElement.removeAttribute('data-library-route');
  }

  @HostListener('window:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    if (this.doc.documentElement.getAttribute('data-library-route') !== 'true') return;
    const target = ev.target as HTMLElement | null;
    if (target && isEditable(target)) return;
    if (ev.key === '[') {
      this.library.stepDensity(-1);
      this.announceDensity();
      ev.preventDefault();
    } else if (ev.key === ']') {
      this.library.stepDensity(1);
      this.announceDensity();
      ev.preventDefault();
    }
  }

  protected setDensity(d: LibraryDensity): void {
    this.library.setDensity(d);
    this.announceDensity();
  }

  protected toggleLevel(v: CefrLevel): void {
    this.library.toggleLevel(v);
  }
  protected toggleSkill(v: LibrarySkill): void {
    this.library.toggleSkill(v);
  }
  protected toggleTag(v: LibraryTag): void {
    this.library.toggleTag(v);
  }
  protected clearFilters(): void {
    this.library.clearFilters();
  }

  protected countSuffix(count: number): string {
    return this.i18n.t('materials.countSuffix', { count });
  }

  protected skillLabel(skill: LibrarySkill): string {
    return this.i18n.t(`materials.filter.skill.${skill}` as I18nKey);
  }

  protected durationFor(lesson: LibraryLesson): string {
    return this.i18n.t('materials.row.duration', {
      minutes: lesson.durationMinutes
    });
  }

  protected progressAria(lesson: LibraryLesson): string {
    return this.i18n.t('materials.row.progressAria', {
      percent: Math.round(lesson.progress)
    });
  }

  private announceDensity(): void {
    this.announcer?.announce(
      this.i18n.t('materials.density.announce', {
        density: this.densityLabels()[this.library.density()]
      }),
      'polite'
    );
  }
}

function isEditable(el: HTMLElement): boolean {
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
}
