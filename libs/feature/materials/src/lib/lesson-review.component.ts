import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewEncapsulation,
  computed,
  inject,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService, type I18nKey } from '@shared/i18n';

import { AudioControllerService } from './audio-controller.service';
import type {
  CorrectionItem,
  LessonReview,
  ReviewTab,
  TranscriptTurn
} from './domain/lesson-review.types';
import { REVIEW_TABS } from './domain/lesson-review.types';

type TurnSegment =
  | { kind: 'text'; text: string }
  | { kind: 'correction'; text: string; correctionIndex: number };

const PULSE_DURATION_MS = 1200;
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
        <div class="mc-review__head-text">
          <p class="mc-review__eyebrow">{{ i18n.t('review.eyebrow') }}</p>
          <h1 class="mc-review__title">{{ review().title }}</h1>
          <p class="mc-review__meta">{{ metaLine() }}</p>
        </div>
        <div class="mc-review__head-actions">
          @if (review().progress < 100) {
            <a
              class="mc-btn mc-btn--secondary"
              [attr.href]="'/materials/lesson/' + review().lessonId + '?tab=transcript&resume=1'"
            >{{ i18n.t('review.action.resume') }}</a>
          }
          <button
            type="button"
            class="mc-btn mc-btn--primary"
            (click)="toggleReplay()"
          >{{ i18n.t('review.action.replay') }}</button>
        </div>
      </header>
      @if (replayOpen()) {
        <aside class="mc-review__replay" role="region" [attr.aria-label]="i18n.t('review.action.replay')">
          <mc-audio-button
            [id]="'replay-' + review().lessonId"
            [ariaLabel]="i18n.t('review.action.replay')"
            variant="primary"
          />
          <span class="mc-review__replay-meta">{{ metaLine() }}</span>
        </aside>
      }

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
                  <article
                    class="mc-review__corr-card"
                    [id]="'mc-correction-card-' + i"
                    [class.is-pulsing]="pulsingCorrection() === i"
                  >
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
                    <p class="mc-review__turn-text">
                      @for (seg of turnSegments(turn); track $index) {
                        @if (seg.kind === 'text') {
                          <span>{{ seg.text }}</span>
                        } @else {
                          <span class="mc-review__corr-anchor">
                            <button
                              type="button"
                              class="mc-transcript-correction"
                              [id]="correctionAnchorId(turn.id, $index)"
                              [attr.aria-expanded]="openPopover() === correctionAnchorId(turn.id, $index)"
                              [attr.aria-haspopup]="'dialog'"
                              (click)="togglePopover(turn.id, $index, seg.correctionIndex)"
                            >{{ seg.text }}</button>
                            @if (openPopover() === correctionAnchorId(turn.id, $index)) {
                              <span
                                class="mc-transcript-popover"
                                role="dialog"
                                [attr.aria-label]="i18n.t('review.corrections.eyebrow')"
                              >
                                <span class="mc-transcript-popover__corrected">{{ correctionFor(seg.correctionIndex)?.correctedLine }}</span>
                                <span class="mc-transcript-popover__note">{{ noteBody(correctionFor(seg.correctionIndex)?.teacherNote ?? '') }}</span>
                                <button
                                  type="button"
                                  class="mc-transcript-popover__link"
                                  (click)="jumpToCorrection(seg.correctionIndex); $event.stopPropagation()"
                                >{{ i18n.t('review.transcript.seeCorrection') }}</button>
                              </span>
                            }
                          </span>
                        }
                      }
                    </p>
                  </div>
                </li>
              }
            </ol>
          }
        }
      </section>
    </main>
  `,
})
export class LessonReviewComponent {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly audio = inject(AudioControllerService);
  private readonly doc = inject(DOCUMENT);

  @HostListener('window:keydown.escape')
  protected onEscape(): void {
    this.audio.stop();
  }

  protected readonly tabs = REVIEW_TABS;

  private readonly tabFromQuery = toSignal(this.route.queryParamMap, {
    requireSync: true
  });

  private readonly lessonId = toSignal(this.route.paramMap, {
    requireSync: true
  });

  private readonly activeSignal = signal<ReviewTab>('overview');
  private readonly replaySignal = signal<boolean>(false);
  protected readonly replayOpen = this.replaySignal.asReadonly();

  protected toggleReplay(): void {
    this.replaySignal.update((v) => !v);
  }

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

  private readonly openPopoverSignal = signal<string | null>(null);
  private readonly pulsingCorrectionSignal = signal<number | null>(null);
  private pulseTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly openPopover = this.openPopoverSignal.asReadonly();
  protected readonly pulsingCorrection = this.pulsingCorrectionSignal.asReadonly();

  protected correctionAnchorId(turnId: string, segIndex: number): string {
    return `${turnId}:${segIndex}`;
  }

  protected turnSegments(turn: TranscriptTurn): readonly TurnSegment[] {
    const spans = turn.corrections;
    if (!spans || spans.length === 0) return [{ kind: 'text', text: turn.text }];
    const segments: TurnSegment[] = [];
    let cursor = 0;
    const working = turn.text;
    // Ordered scan: find each span in text order; skip spans not found.
    const ordered = [...spans]
      .map((s) => ({ ...s, pos: working.indexOf(s.fragment, cursor) }))
      .filter((s) => s.pos >= 0)
      .sort((a, b) => a.pos - b.pos);
    for (const span of ordered) {
      if (span.pos > cursor) {
        segments.push({ kind: 'text', text: working.slice(cursor, span.pos) });
      }
      segments.push({
        kind: 'correction',
        text: span.fragment,
        correctionIndex: span.correctionIndex
      });
      cursor = span.pos + span.fragment.length;
    }
    if (cursor < working.length) {
      segments.push({ kind: 'text', text: working.slice(cursor) });
    }
    return segments;
  }

  protected correctionFor(index: number): CorrectionItem | null {
    return this.review().corrections[index] ?? null;
  }

  protected togglePopover(turnId: string, segIndex: number, _correctionIndex: number): void {
    const id = this.correctionAnchorId(turnId, segIndex);
    this.openPopoverSignal.update((v) => (v === id ? null : id));
  }

  protected jumpToCorrection(index: number): void {
    this.openPopoverSignal.set(null);
    this.setActive('corrections');
    this.pulsingCorrectionSignal.set(index);
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
    this.pulseTimer = setTimeout(() => {
      this.pulsingCorrectionSignal.set(null);
      this.pulseTimer = null;
    }, PULSE_DURATION_MS);
    // Scroll the matching card into view on the next frame once the panel
    // has rendered. Uses the DOM directly since the cards render via @for.
    queueMicrotask(() => {
      const el = this.doc.getElementById(`mc-correction-card-${index}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(ev: Event): void {
    if (this.openPopoverSignal() === null) return;
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.mc-transcript-correction, .mc-transcript-popover')) return;
    this.openPopoverSignal.set(null);
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
