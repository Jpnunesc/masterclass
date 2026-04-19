import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject
} from '@angular/core';

import type { CefrLevel } from '@feature/assessment';
import { type MaterialTopic, MATERIAL_TOPICS } from '@feature/materials';
import { LIVE_ANNOUNCER } from '@shared/a11y';
import { I18nService, type I18nKey } from '@shared/i18n';

import { LessonHistoryService } from './lesson-history.service';
import type {
  LessonSessionId
} from './domain/lesson-session.types';
import {
  SessionFilterBarComponent,
  type SessionFilterLabels
} from './ui/session-filter-bar.component';
import {
  SessionListComponent,
  type SessionListLabels
} from './ui/session-list.component';
import {
  SessionDetailComponent,
  type SessionDetailLabels
} from './ui/session-detail.component';
import type { TranscriptLabels } from './ui/transcript-view.component';
import { seedDemoSessions } from './pipeline/demo-sessions';

@Component({
  selector: 'mc-lesson-history',
  standalone: true,
  imports: [
    SessionFilterBarComponent,
    SessionListComponent,
    SessionDetailComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-lesson-history mc-container mc-stack">
      <header class="mc-lesson-history-head">
        <p class="mc-caption">{{ i18n.t('history.kicker') }}</p>
        <h1 class="mc-display-md">{{ i18n.t('history.title') }}</h1>
        <p class="mc-body-lg mc-lead">{{ i18n.t('history.lead') }}</p>
      </header>

      <mc-session-filter-bar
        [query]="service.query()"
        [labels]="filterLabels()"
        (searchChange)="onSearchChange($event)"
        (levelChange)="onLevelChange($event)"
        (topicChange)="onTopicChange($event)"
      />

      <p
        class="mc-lesson-history-meta mc-body-sm"
        role="status"
        [attr.aria-live]="'polite'"
      >
        {{ resultsSummary() }}
      </p>

      <div class="mc-lesson-history-layout">
        <mc-session-list
          [sessions]="service.visibleSessions()"
          [selectedId]="service.selectedId()"
          [labels]="listLabels()"
          (opened)="onSelect($event)"
        />

        @if (service.selectedSession(); as session) {
          <mc-session-detail
            [session]="session"
            [labels]="detailLabels()"
            (closed)="onClose()"
          />
        } @else {
          <aside class="mc-lesson-history-placeholder" role="note">
            {{ i18n.t('history.detail.empty') }}
          </aside>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mc-lesson-history {
        padding-block: var(--mc-pad-section);
        display: grid;
        gap: var(--mc-gap-stack);
      }
      .mc-lesson-history-head {
        display: grid;
        gap: var(--mc-space-2);
        max-width: var(--mc-reading-max);
      }
      .mc-lesson-history-layout {
        display: grid;
        gap: var(--mc-gap-stack);
        grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
        align-items: start;
      }
      .mc-lesson-history-meta { color: var(--mc-text-muted); }
      .mc-lesson-history-placeholder {
        padding: var(--mc-pad-card);
        border-radius: var(--mc-radius-lg);
        background: var(--mc-surface-muted);
        color: var(--mc-text-secondary);
        border: 1px dashed var(--mc-border-strong);
        min-height: 12rem;
        display: grid;
        place-items: center;
        text-align: center;
      }
      @media (max-width: 56rem) {
        .mc-lesson-history-layout {
          grid-template-columns: minmax(0, 1fr);
        }
      }
    `
  ]
})
export class LessonHistoryComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(LessonHistoryService);
  private readonly announcer = inject(LIVE_ANNOUNCER);

  ngOnInit(): void {
    if (this.service.sessions().length === 0) {
      this.service.seed(seedDemoSessions(this.i18n.locale()));
    }
  }

  protected readonly topicLabelByKey = computed(() => {
    const out = {} as Record<MaterialTopic, string>;
    for (const topic of MATERIAL_TOPICS) {
      out[topic] = this.i18n.t(`materials.topic.${topic}` as I18nKey);
    }
    return out;
  });

  protected readonly filterLabels = computed<SessionFilterLabels>(() => ({
    barAria: this.i18n.t('history.filter.aria'),
    searchLabel: this.i18n.t('history.filter.search'),
    searchPlaceholder: this.i18n.t('history.filter.search.placeholder'),
    levelLabel: this.i18n.t('history.filter.level'),
    levelAll: this.i18n.t('history.filter.level.all'),
    topicLabel: this.i18n.t('history.filter.topic'),
    topicAll: this.i18n.t('history.filter.topic.all'),
    topicByKey: this.topicLabelByKey()
  }));

  protected readonly listLabels = computed<SessionListLabels>(() => ({
    listAria: this.i18n.t('history.list.aria'),
    emptyLabel: this.i18n.t('history.list.empty'),
    durationLabel: (s) => this.formatDuration(s),
    dateLabel: (iso) => this.formatDate(iso),
    topicLabel: (topic) =>
      this.i18n.t(`materials.topic.${topic}` as I18nKey),
    openAriaLabel: (title) =>
      this.i18n.t('history.list.open.aria', { title }),
    turnCountLabel: (count) =>
      this.i18n.t('history.list.turn_count', { count })
  }));

  protected readonly transcriptLabels = computed<TranscriptLabels>(() => ({
    studentLabel: this.i18n.t('history.transcript.student'),
    teacherLabel: this.i18n.t('history.transcript.teacher'),
    timeLabel: (iso) => this.formatTime(iso),
    correctionHeading: this.i18n.t('history.corrections.heading'),
    correctionEmpty: this.i18n.t('history.corrections.empty'),
    correctionBefore: this.i18n.t('history.corrections.before'),
    correctionAfter: this.i18n.t('history.corrections.after')
  }));

  protected readonly detailLabels = computed<SessionDetailLabels>(() => ({
    sectionAria: this.i18n.t('history.detail.aria'),
    transcriptHeading: this.i18n.t('history.detail.transcript'),
    pronunciationHeading: this.i18n.t('history.detail.pronunciation'),
    pronunciationEmpty: this.i18n.t('history.detail.pronunciation.empty'),
    participantsHeading: this.i18n.t('history.detail.participants'),
    completedAtLabel: (iso) =>
      this.i18n.t('history.detail.completed_at', { date: this.formatDate(iso) }),
    durationLabel: (s) =>
      this.i18n.t('history.detail.duration', { duration: this.formatDuration(s) }),
    topicLabel: (topic) =>
      this.i18n.t(`materials.topic.${topic}` as I18nKey),
    closeLabel: this.i18n.t('history.detail.close'),
    scoreLabel: (score) =>
      this.i18n.t('history.detail.score', { score: Math.round(score * 100) }),
    deltaUp: this.i18n.t('history.pronunciation.up'),
    deltaDown: this.i18n.t('history.pronunciation.down'),
    deltaFlat: this.i18n.t('history.pronunciation.flat'),
    transcriptLabels: this.transcriptLabels()
  }));

  protected readonly resultsSummary = computed(() => {
    const total = this.service.sessions().length;
    const visible = this.service.visibleSessions().length;
    const ms = this.service.lastSearchDurationMs();
    return this.i18n.t('history.results.summary', {
      visible,
      total,
      ms: ms.toFixed(1)
    });
  });

  onSearchChange(text: string): void {
    this.service.setSearchText(text);
  }

  onLevelChange(level: CefrLevel | 'all'): void {
    this.service.setLevelFilter(level);
  }

  onTopicChange(topic: MaterialTopic | 'all'): void {
    this.service.setTopicFilter(topic);
  }

  onSelect(id: LessonSessionId): void {
    this.service.select(id);
    const session = this.service.selectedSession();
    if (session) {
      this.announcer.announce(
        this.i18n.t('history.selected.announced', { title: session.summary }),
        'polite'
      );
    }
  }

  onClose(): void {
    this.service.select(null);
  }

  private formatDuration(seconds: number): string {
    if (seconds <= 0) return this.i18n.t('history.duration.zero');
    const mins = Math.round(seconds / 60);
    return this.i18n.t('history.duration.minutes', { minutes: mins });
  }

  private formatDate(iso: string): string {
    const parsed = Date.parse(iso);
    if (Number.isNaN(parsed)) return iso;
    const tag = this.i18n.locale() === 'pt-BR' ? 'pt-BR' : 'en-US';
    return new Date(parsed).toLocaleString(tag, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatTime(iso: string): string {
    const parsed = Date.parse(iso);
    if (Number.isNaN(parsed)) return iso;
    const tag = this.i18n.locale() === 'pt-BR' ? 'pt-BR' : 'en-US';
    return new Date(parsed).toLocaleTimeString(tag, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
