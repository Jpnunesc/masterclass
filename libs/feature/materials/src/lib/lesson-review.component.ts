import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService, type I18nKey } from '@shared/i18n';

import type {
  LessonReview,
  ReviewTab,
  TranscriptTurn
} from './domain/lesson-review.types';
import { REVIEW_TABS } from './domain/lesson-review.types';
import { demoLessonReview } from './pipeline/demo-lesson-review';
import { AudioButtonComponent } from './ui/audio-button.component';

@Component({
  selector: 'mc-lesson-review',
  standalone: true,
  imports: [AudioButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <main class="mc-review" id="main">
      <nav>
        <a class="mc-review__back" routerLink="/materials">
          {{ i18n.t('review.back') }}
        </a>
      </nav>

      <header class="mc-review__head">
        <p class="mc-review__eyebrow">{{ i18n.t('review.eyebrow') }}</p>
        <h1 class="mc-review__title">{{ review().title }}</h1>
        <p class="mc-review__meta">{{ metaLine() }}</p>
      </header>

      <div class="mc-review__tabs" role="tablist" [attr.aria-label]="i18n.t('review.eyebrow')">
        @for (tab of tabs; track tab) {
          <button
            type="button"
            role="tab"
            class="mc-review__tab"
            [class.is-active]="active() === tab"
            [id]="tabId(tab)"
            [attr.aria-selected]="active() === tab"
            [attr.aria-controls]="panelId(tab)"
            [tabindex]="active() === tab ? 0 : -1"
            (click)="setActive(tab)"
            (keydown.ArrowRight)="cycleTab(1); $event.preventDefault()"
            (keydown.ArrowLeft)="cycleTab(-1); $event.preventDefault()"
          >
            {{ tabLabel(tab) }}
            @if (tabCount(tab) > 0) {
              <span class="mc-review__tab-count">{{ tabCountLabel(tab) }}</span>
            }
          </button>
        }
      </div>

      <section
        class="mc-review__panel"
        role="tabpanel"
        [id]="panelId(active())"
        [attr.aria-labelledby]="tabId(active())"
      >
        @switch (active()) {
          @case ('overview') {
            <div class="mc-review__summary">
              <p class="mc-review__sum-eyebrow">{{ i18n.t('review.overview.summary.eyebrow') }}</p>
              <p class="mc-review__sum-body">{{ review().summary }}</p>
            </div>
            <div class="mc-review__stats">
              <div class="mc-review__stat">
                <div class="mc-review__stat-num">{{ review().durationMinutes }}</div>
                <div class="mc-review__stat-label">{{ i18n.t('review.overview.stats.duration') }}</div>
              </div>
              <div class="mc-review__stat">
                <div class="mc-review__stat-num">{{ review().stats.wordsSpoken }}</div>
                <div class="mc-review__stat-label">{{ i18n.t('review.overview.stats.words') }}</div>
              </div>
              <div class="mc-review__stat">
                <div class="mc-review__stat-num">{{ review().stats.newVocabCount }}</div>
                <div class="mc-review__stat-label">{{ i18n.t('review.overview.stats.newVocab') }}</div>
              </div>
            </div>
            <div class="mc-review__bullets">
              <h2 class="mc-review__sec-title">{{ i18n.t('review.overview.wins') }}</h2>
              <ul>
                @for (w of review().wins; track w) {
                  <li class="mc-review__win">{{ w }}</li>
                }
              </ul>
            </div>
            <div class="mc-review__bullets">
              <h2 class="mc-review__sec-title">{{ i18n.t('review.overview.focus') }}</h2>
              <ul>
                @for (f of review().focus; track f) {
                  <li class="mc-review__focus">{{ f }}</li>
                }
              </ul>
            </div>
          }

          @case ('vocabulary') {
            @if (review().vocabulary.length > 0) {
              <p class="mc-review__intro">
                {{ i18n.t('review.vocab.intro', {
                    new: review().stats.newVocabCount,
                    reviewed: review().stats.reviewedVocabCount
                  }) }}
              </p>
              <div class="mc-review__vocab-grid">
                @for (v of review().vocabulary; track v.term) {
                  <article class="mc-review__vocab-card">
                    <p class="mc-review__vocab-eyebrow">{{ i18n.t('review.vocab.eyebrow') }}</p>
                    <h3 class="mc-review__vocab-term">{{ v.term }}</h3>
                    <p class="mc-review__vocab-ipa">{{ v.ipa }}</p>
                    <p class="mc-review__vocab-gloss">{{ v.gloss }}</p>
                    <div class="mc-review__vocab-examples">
                      <ul>
                        @for (ex of v.examples; track ex; let i = $index) {
                          <li>
                            <span>{{ ex }}</span>
                            @if (v.translations?.[i]) {
                              <span class="mc-review__vocab-trans">{{ v.translations![i] }}</span>
                            }
                          </li>
                        }
                      </ul>
                    </div>
                    <div class="mc-review__vocab-audio">
                      <mc-audio-button
                        [id]="'vocab-word-' + v.term"
                        [ariaLabel]="hearWordAria(v.term)"
                        variant="primary"
                      />
                      <mc-audio-button
                        [id]="'vocab-ipa-' + v.term"
                        [ariaLabel]="hearIpaAria(v.term)"
                        variant="secondary"
                      />
                    </div>
                  </article>
                }
              </div>
            } @else {
              <p class="mc-review__empty">{{ i18n.t('review.vocab.empty') }}</p>
            }
          }

          @case ('grammar') {
            <div class="mc-review__grammar-list">
              @for (g of review().grammar; track g.rule; let i = $index) {
                <article class="mc-review__grammar-card">
                  <p class="mc-review__grammar-eyebrow">{{ i18n.t('review.grammar.eyebrow') }}</p>
                  <h3 class="mc-review__grammar-rule">{{ g.rule }}</h3>
                  <ul class="mc-review__grammar-examples">
                    @for (ex of g.examples; track ex) {
                      <li>
                        <span class="mc-sr-only">{{ exampleLabel() }}</span>
                        {{ ex }}
                      </li>
                    }
                  </ul>
                  @if (g.hint) {
                    <p class="mc-review__grammar-hint">{{ g.hint }}</p>
                  }
                </article>
              }
            </div>
          }

          @case ('corrections') {
            @if (review().corrections.length > 0) {
              <div class="mc-review__corr-list">
                @for (c of review().corrections; track c.studentLine; let i = $index) {
                  <article class="mc-review__corr-card">
                    <p class="mc-review__corr-eyebrow">{{ i18n.t('review.corrections.eyebrow') }}</p>
                    <p class="mc-review__corr-student">{{ quoteStudent(c.studentLine) }}</p>
                    <p class="mc-review__corr-corrected">{{ c.correctedLine }}</p>
                    <p class="mc-review__corr-note">
                      <span class="mc-sr-only">{{ noteLabel() }}</span>
                      {{ noteBody(c.teacherNote) }}
                    </p>
                    <div class="mc-review__corr-audio">
                      <mc-audio-button
                        [id]="'correction-' + i"
                        [ariaLabel]="hearCorrectedAria(c.correctedLine)"
                        variant="secondary"
                      />
                    </div>
                  </article>
                }
              </div>
            } @else {
              <p class="mc-review__empty">{{ i18n.t('review.corrections.empty') }}</p>
            }
          }

          @case ('transcript') {
            <ol class="mc-review__transcript">
              @for (turn of review().transcript; track turn.id) {
                <li
                  class="mc-review__turn"
                  [class.is-student]="turn.speaker === 'student'"
                >
                  <div class="mc-review__avatar" aria-hidden="true">{{ avatarText(turn.speaker) }}</div>
                  <div class="mc-review__turn-body">
                    <p class="mc-review__turn-head">
                      <span class="mc-review__turn-speaker">{{ speakerLabel(turn.speaker) }}</span>
                      <span class="mc-review__turn-ts">{{ formatTs(turn.seconds) }}</span>
                    </p>
                    <p class="mc-review__turn-text">{{ turn.text }}</p>
                  </div>
                </li>
              }
            </ol>
          }
        }
      </section>
    </main>
  `,
  styles: [
    `
      .mc-review {
        display: grid;
        gap: var(--mc-space-5);
        max-width: var(--mc-shell-nav-max);
        margin: 0 auto;
        padding: var(--mc-space-8) var(--mc-space-5);
      }
      @media (min-width: 1024px) {
        .mc-review {
          padding: var(--mc-space-10) var(--mc-space-10);
        }
      }
      .mc-review__back {
        display: inline-flex;
        min-height: 40px;
        align-items: center;
        color: var(--mc-ink-muted);
        text-decoration: none;
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .mc-review__back:hover {
        color: var(--mc-ink);
      }
      .mc-review__head {
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-review__eyebrow {
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        color: var(--mc-ink-muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin: 0;
      }
      .mc-review__title {
        font: var(--mc-fs-display-md) / var(--mc-lh-tight) var(--mc-font-display);
        color: var(--mc-ink);
        margin: 0;
      }
      .mc-review__meta {
        font: var(--mc-fs-body-sm) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
        margin: 0;
      }

      .mc-review__tabs {
        display: flex;
        gap: var(--mc-space-4);
        border-bottom: 1px solid var(--mc-line);
        overflow-x: auto;
        scrollbar-width: none;
      }
      .mc-review__tabs::-webkit-scrollbar { display: none; }
      .mc-review__tab {
        position: relative;
        padding: 14px 4px;
        background: transparent;
        border: 0;
        color: var(--mc-ink-muted);
        cursor: pointer;
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .mc-review__tab::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 0;
        background: var(--mc-accent);
        transition: height var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-review__tab.is-active {
        color: var(--mc-ink);
      }
      .mc-review__tab.is-active::after {
        height: 2px;
      }
      .mc-review__tab-count {
        color: var(--mc-ink-muted);
        font-weight: 400;
        margin-left: 4px;
      }

      .mc-review__panel {
        display: grid;
        gap: var(--mc-space-6);
        max-width: 55rem;
      }
      .mc-review__sum-eyebrow {
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        color: var(--mc-ink-muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin: 0 0 6px;
      }
      .mc-review__sum-body {
        font: var(--mc-fs-body-lg) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink);
        margin: 0;
      }
      .mc-review__summary {
        padding: var(--mc-space-6);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
      }
      .mc-review__stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--mc-space-4);
      }
      @media (max-width: 720px) {
        .mc-review__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      .mc-review__stat {
        padding: var(--mc-space-5);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        text-align: center;
      }
      .mc-review__stat-num {
        font: var(--mc-fs-display-md) / 1 var(--mc-font-display);
        color: var(--mc-ink);
      }
      .mc-review__stat-label {
        margin-top: 4px;
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        color: var(--mc-ink-muted);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .mc-review__bullets ul { margin: 0; padding-left: 20px; }
      .mc-review__sec-title {
        font: var(--mc-fs-heading-md) / 1.3 var(--mc-font-body);
        color: var(--mc-ink);
        margin: 0 0 var(--mc-space-2);
      }
      .mc-review__win::marker { color: var(--mc-status-success); }
      .mc-review__focus::marker { color: var(--mc-status-warning); }

      .mc-review__intro {
        font: var(--mc-fs-body-sm) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
        margin: 0;
      }
      .mc-review__vocab-grid {
        display: grid;
        gap: var(--mc-space-5);
        align-items: stretch;
        grid-template-columns: 1fr;
      }
      @media (min-width: 768px) {
        .mc-review__vocab-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      .mc-review__vocab-card,
      .mc-review__grammar-card,
      .mc-review__corr-card {
        position: relative;
        display: grid;
        gap: var(--mc-space-2);
        padding: 24px 24px 20px;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        background-image:
          linear-gradient(to bottom, transparent 31px, var(--mc-line) 31px, var(--mc-line) 32px, transparent 32px);
        background-size: 100% 32px;
        background-repeat: repeat-y;
      }
      @media (min-width: 1024px) {
        .mc-review__vocab-card,
        .mc-review__grammar-card,
        .mc-review__corr-card {
          padding: 32px 32px 24px;
        }
      }
      .mc-review__vocab-eyebrow,
      .mc-review__grammar-eyebrow,
      .mc-review__corr-eyebrow {
        margin: 0;
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        color: var(--mc-ink-muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        border-bottom: 2px solid var(--mc-accent);
        padding-bottom: 4px;
        width: fit-content;
      }
      .mc-review__grammar-eyebrow {
        border-bottom-color: var(--mc-ink-muted);
      }
      .mc-review__corr-eyebrow {
        border-bottom-color: var(--mc-status-danger);
      }
      .mc-review__vocab-term {
        font: var(--mc-fs-display-md) / 1.1 var(--mc-font-display);
        color: var(--mc-ink);
        margin: 0;
      }
      .mc-review__vocab-ipa {
        font: var(--mc-fs-body-md) / 1.3 var(--mc-font-mono);
        color: var(--mc-ink-muted);
        margin: 0;
      }
      .mc-review__vocab-gloss {
        font: var(--mc-fs-body-md) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink);
        margin: 0;
      }
      .mc-review__vocab-examples {
        padding: var(--mc-space-3) var(--mc-space-4);
        background: var(--mc-bg-inset);
        border-radius: var(--mc-radius-md);
      }
      .mc-review__vocab-examples ul {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: var(--mc-space-2);
      }
      .mc-review__vocab-trans {
        display: block;
        margin-top: 4px;
        font: var(--mc-fs-body-sm) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
      }
      .mc-review__vocab-audio {
        display: flex;
        justify-content: flex-end;
        gap: var(--mc-space-2);
      }

      .mc-review__grammar-list,
      .mc-review__corr-list {
        display: grid;
        gap: var(--mc-space-5);
      }
      .mc-review__grammar-rule {
        font: var(--mc-fs-heading-sm) / 1.3 var(--mc-font-body);
        color: var(--mc-ink);
        margin: 0;
      }
      .mc-review__grammar-examples {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: var(--mc-space-2);
        font: var(--mc-fs-body-lg) / var(--mc-lh-normal) var(--mc-font-body);
      }
      .mc-review__grammar-examples li {
        text-decoration: underline;
        text-decoration-color: var(--mc-accent);
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
      }
      .mc-review__grammar-hint {
        padding: var(--mc-space-3) var(--mc-space-4);
        background: var(--mc-bg-inset);
        border-radius: var(--mc-radius-md);
        font: var(--mc-fs-body-sm) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
        margin: 0;
      }

      .mc-review__corr-card {
        border-left: 3px solid var(--mc-status-danger);
      }
      .mc-review__corr-student {
        font: var(--mc-fs-body-lg) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
        text-decoration: line-through;
        text-decoration-color: var(--mc-status-danger);
        text-decoration-thickness: 1.5px;
        margin: 0;
      }
      .mc-review__corr-corrected {
        font: var(--mc-fs-body-lg) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink);
        margin: 0;
      }
      .mc-review__corr-note {
        font: var(--mc-fs-body-sm) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink-muted);
        margin: 0;
      }
      .mc-review__corr-audio {
        display: flex;
        justify-content: flex-end;
      }

      .mc-review__transcript {
        list-style: none;
        padding: 0;
        display: grid;
        gap: var(--mc-space-5);
      }
      .mc-review__turn {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr);
        gap: var(--mc-space-3);
      }
      .mc-review__turn.is-student {
        grid-template-columns: minmax(0, 1fr) 40px;
        text-align: end;
      }
      .mc-review__turn.is-student .mc-review__avatar {
        order: 2;
        background: var(--mc-accent-soft);
      }
      .mc-review__turn.is-student .mc-review__turn-body {
        order: 1;
      }
      .mc-review__avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--mc-bg-inset);
        border: 1px solid var(--mc-line-strong);
        font: var(--mc-fs-heading-sm) / 1 var(--mc-font-body);
        color: var(--mc-ink);
      }
      .mc-review__turn-head {
        display: inline-flex;
        gap: var(--mc-space-2);
        font: var(--mc-fs-caption) / 1 var(--mc-font-body);
        color: var(--mc-ink-muted);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin: 0 0 4px;
      }
      .mc-review__turn-ts {
        font-family: var(--mc-font-mono);
        text-transform: none;
      }
      .mc-review__turn.is-student .mc-review__turn-head {
        justify-content: flex-end;
      }
      .mc-review__turn-text {
        font: var(--mc-fs-body-lg) / var(--mc-lh-normal) var(--mc-font-body);
        color: var(--mc-ink);
        margin: 0;
        overflow-wrap: anywhere;
      }

      .mc-review__empty {
        padding: var(--mc-space-6);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        color: var(--mc-ink-muted);
      }

      .mc-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ]
})
export class LessonReviewComponent {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly tabs = REVIEW_TABS;

  private readonly tabFromQuery = toSignal(this.route.queryParamMap, {
    requireSync: true
  });

  private readonly lessonId = toSignal(this.route.paramMap, {
    requireSync: true
  });

  private readonly activeSignal = signal<ReviewTab>('overview');

  constructor() {
    const fromQuery = this.tabFromQuery().get('tab');
    if (fromQuery && (REVIEW_TABS as readonly string[]).includes(fromQuery)) {
      this.activeSignal.set(fromQuery as ReviewTab);
    }
  }

  protected readonly active = this.activeSignal.asReadonly();

  protected readonly review = computed<LessonReview>(() => {
    const id = this.lessonId().get('lessonId') ?? 'l-01';
    return demoLessonReview(id, this.i18n.locale());
  });

  protected readonly metaLine = computed(() =>
    this.i18n.t('review.meta', {
      date: this.formatDate(this.review().dateISO),
      duration: this.i18n.t('materials.row.duration', {
        minutes: this.review().durationMinutes
      })
    })
  );

  protected setActive(tab: ReviewTab): void {
    if (this.activeSignal() === tab) return;
    this.activeSignal.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  protected cycleTab(delta: 1 | -1): void {
    const idx = REVIEW_TABS.indexOf(this.activeSignal());
    const next = REVIEW_TABS[(idx + delta + REVIEW_TABS.length) % REVIEW_TABS.length];
    this.setActive(next);
  }

  protected tabLabel(tab: ReviewTab): string {
    return this.i18n.t(`review.tabs.${tab}` as I18nKey);
  }

  protected tabCountLabel(tab: ReviewTab): string {
    return `\u00b7 ${this.tabCount(tab)}`;
  }

  protected exampleLabel(): string {
    return `${this.i18n.t('review.grammar.exampleLabel')}:`;
  }

  protected noteLabel(): string {
    return `${this.i18n.t('review.corrections.note')}:`;
  }

  protected quoteStudent(line: string): string {
    return `\u201c${line}\u201d`;
  }

  protected noteBody(note: string): string {
    return `\u2014 ${note}`;
  }

  protected tabCount(tab: ReviewTab): number {
    const r = this.review();
    if (tab === 'vocabulary') return r.vocabulary.length;
    if (tab === 'grammar') return r.grammar.length;
    if (tab === 'corrections') return r.corrections.length;
    if (tab === 'transcript') return r.transcript.length;
    return 0;
  }

  protected tabId(tab: ReviewTab): string {
    return `mc-review-tab-${tab}`;
  }
  protected panelId(tab: ReviewTab): string {
    return `mc-review-panel-${tab}`;
  }

  protected hearWordAria(term: string): string {
    return `${this.i18n.t('review.vocab.hearWord')}: ${term}`;
  }
  protected hearIpaAria(term: string): string {
    return `${this.i18n.t('review.vocab.hearIpa')}: ${term}`;
  }
  protected hearCorrectedAria(line: string): string {
    return `${this.i18n.t('review.corrections.hearCorrected')}: ${line}`;
  }

  protected speakerLabel(s: TranscriptTurn['speaker']): string {
    return this.i18n.t(
      s === 'teacher' ? 'review.transcript.speaker.teacher' : 'review.transcript.speaker.student'
    );
  }

  protected avatarText(s: TranscriptTurn['speaker']): string {
    return s === 'teacher' ? 'T' : this.speakerLabel(s).charAt(0);
  }

  protected formatTs(seconds: number): string {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return this.i18n.t('review.transcript.timestamp', { mm, ss });
  }

  private formatDate(iso: string): string {
    const d = Date.parse(iso);
    if (Number.isNaN(d)) return iso;
    const tag = this.i18n.locale();
    return new Date(d).toLocaleDateString(tag, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
