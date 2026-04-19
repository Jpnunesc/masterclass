import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';

import type { TimelineEvent } from '../domain/progress.types';

export interface TimelineLabels {
  readonly headingLabel: string;
  readonly leadLabel: string;
  readonly emptyLabel: string;
  readonly scoreDeltaUp: string;
  readonly scoreDeltaDown: string;
  readonly scoreDeltaFlat: string;
  readonly kindAssessed: string;
  readonly kindLesson: string;
  readonly kindMaterial: string;
  readonly kindSkill: string;
  readonly kindMilestone: string;
  readonly listAriaLabel: string;
  readonly rowCountLabel: (count: number) => string;
}

const ROW_HEIGHT_PX = 96;
const VIEWPORT_HEIGHT_PX = 640;
const OVERSCAN_ROWS = 4;

/**
 * Virtualized evolution timeline. Renders only rows within the scroll viewport
 * + overscan so 200+ events don't push thousands of nodes into the DOM. Rows
 * sit in a `role="list"` container and expose their index to assistive tech
 * via `aria-rowindex`.
 */
@Component({
  selector: 'mc-progress-evolution-timeline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-progress-timeline"
      role="group"
      [attr.aria-label]="labels.headingLabel"
    >
      <header class="mc-progress-timeline-head">
        <h2 class="mc-heading-md">{{ labels.headingLabel }}</h2>
        <p class="mc-progress-timeline-lead">{{ labels.leadLabel }}</p>
        <p class="mc-progress-timeline-count" aria-live="polite">
          {{ labels.rowCountLabel(events.length) }}
        </p>
      </header>
      @if (events.length > 0) {
        <div
          class="mc-progress-timeline-viewport"
          #viewport
          (scroll)="onScroll()"
          [style.height.px]="viewportHeight"
          role="list"
          [attr.aria-label]="labels.listAriaLabel"
          [attr.aria-rowcount]="events.length"
          tabindex="0"
        >
          <div
            class="mc-progress-timeline-spacer"
            [style.height.px]="totalHeight()"
          ></div>
          <ol
            class="mc-progress-timeline-window"
            [style.transform]="windowTransform()"
          >
            @for (event of windowItems(); track event.id; let i = $index) {
              <li
                class="mc-progress-timeline-row"
                role="listitem"
                [attr.aria-rowindex]="firstIndex() + i + 1"
                [style.height.px]="rowHeight"
              >
                <article class="mc-progress-timeline-card">
                  <div class="mc-progress-timeline-card-head">
                    <span
                      class="mc-progress-timeline-badge"
                      [attr.data-kind]="event.kind"
                    >
                      {{ kindLabelFor(event) }}
                    </span>
                    <time
                      class="mc-progress-timeline-time"
                      [attr.datetime]="event.occurredAt"
                    >
                      {{ formatTime(event.occurredAt) }}
                    </time>
                  </div>
                  <p class="mc-progress-timeline-summary">
                    {{ summaryFor(event) }}
                  </p>
                  @if (event.scoreDelta !== undefined) {
                    <p
                      class="mc-progress-timeline-delta"
                      [attr.data-direction]="deltaDirection(event.scoreDelta)"
                    >
                      {{ deltaLabelFor(event.scoreDelta) }}
                    </p>
                  }
                </article>
              </li>
            }
          </ol>
        </div>
      } @else {
        <p class="mc-progress-timeline-empty" role="status">
          {{ labels.emptyLabel }}
        </p>
      }
    </section>
  `,
  styles: [
    `
:host { display: block; }
.mc-progress-timeline { display: grid; gap: var(--mc-gap-stack); padding: var(--mc-pad-card); border-radius: var(--mc-radius-lg); background: var(--mc-surface-raised); border: 1px solid var(--mc-border-subtle); box-shadow: var(--mc-elevation-1); }
.mc-progress-timeline-head h2 { margin: 0; font-family: var(--mc-font-display); color: var(--mc-text-primary); }
.mc-progress-timeline-lead { margin: 0; color: var(--mc-text-secondary); line-height: var(--mc-lh-body); }
.mc-progress-timeline-count { margin: 0; color: var(--mc-text-muted); font-size: var(--mc-fs-caption); text-transform: uppercase; letter-spacing: var(--mc-tracking-wide); }
.mc-progress-timeline-viewport { position: relative; overflow: auto; border: 1px solid var(--mc-border-subtle); border-radius: var(--mc-radius-md); background: var(--mc-surface-canvas); }
.mc-progress-timeline-viewport:focus-visible { outline: 2px solid var(--mc-focus-ring); outline-offset: 2px; }
.mc-progress-timeline-spacer { width: 1px; }
.mc-progress-timeline-window { position: absolute; inset-inline: 0; top: 0; margin: 0; padding: 0; list-style: none; display: grid; }
.mc-progress-timeline-row { padding: var(--mc-space-3) var(--mc-pad-control-x); border-bottom: 1px solid var(--mc-border-subtle); }
.mc-progress-timeline-card { display: grid; gap: var(--mc-space-1); }
.mc-progress-timeline-card-head { display: flex; gap: var(--mc-space-3); align-items: baseline; }
.mc-progress-timeline-badge { padding: var(--mc-space-1) var(--mc-space-2); border-radius: var(--mc-radius-pill); background: var(--mc-accent-100); color: var(--mc-text-accent); text-transform: uppercase; font-size: var(--mc-fs-caption); letter-spacing: var(--mc-tracking-wide); }
.mc-progress-timeline-badge[data-kind='material_viewed'] { background: var(--mc-color-moss-200); color: var(--mc-color-moss-700); }
.mc-progress-timeline-badge[data-kind='skill_practiced'] { background: var(--mc-color-clay-100); color: var(--mc-color-clay-700); }
.mc-progress-timeline-time { color: var(--mc-text-muted); font-size: var(--mc-fs-caption); }
.mc-progress-timeline-summary { margin: 0; color: var(--mc-text-primary); }
.mc-progress-timeline-delta { margin: 0; font-size: var(--mc-fs-caption); color: var(--mc-text-muted); }
.mc-progress-timeline-delta[data-direction='up'] { color: var(--mc-status-success); }
.mc-progress-timeline-delta[data-direction='down'] { color: var(--mc-status-danger); }
.mc-progress-timeline-empty { padding: var(--mc-pad-card); border: 1px dashed var(--mc-border-strong); border-radius: var(--mc-radius-md); background: var(--mc-surface-muted); color: var(--mc-text-secondary); text-align: center; }
    `
  ]
})
export class ProgressEvolutionTimelineComponent implements OnDestroy {
  private readonly zone = inject(NgZone);

  @Input({ required: true }) events: readonly TimelineEvent[] = [];
  @Input({ required: true }) labels!: TimelineLabels;
  @Input() rowHeight = ROW_HEIGHT_PX;
  @Input() viewportHeight = VIEWPORT_HEIGHT_PX;
  @Input() locale: 'en' | 'pt' = 'en';

  @ViewChild('viewport') private viewport?: ElementRef<HTMLDivElement>;

  private readonly scrollTop = signal(0);
  private rafId: number | null = null;

  protected readonly totalHeight = computed(
    () => this.events.length * this.rowHeight
  );

  protected readonly firstIndex = computed(() => {
    const top = this.scrollTop();
    const idx = Math.floor(top / this.rowHeight) - OVERSCAN_ROWS;
    return Math.max(0, idx);
  });

  protected readonly windowItems = computed(() => {
    const visibleRows =
      Math.ceil(this.viewportHeight / this.rowHeight) + OVERSCAN_ROWS * 2;
    const start = this.firstIndex();
    const end = Math.min(this.events.length, start + visibleRows);
    return this.events.slice(start, end);
  });

  protected readonly windowTransform = computed(
    () => `translate3d(0, ${this.firstIndex() * this.rowHeight}px, 0)`
  );

  onScroll(): void {
    if (this.rafId !== null) return;
    this.zone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.zone.run(() => {
          const el = this.viewport?.nativeElement;
          if (el) this.scrollTop.set(el.scrollTop);
        });
      });
    });
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  protected kindLabelFor(event: TimelineEvent): string {
    switch (event.kind) {
      case 'level_assessed':
        return this.labels.kindAssessed;
      case 'lesson_completed':
        return this.labels.kindLesson;
      case 'material_viewed':
        return this.labels.kindMaterial;
      case 'skill_practiced':
        return this.labels.kindSkill;
      case 'milestone_reached':
        return this.labels.kindMilestone;
    }
  }

  protected summaryFor(event: TimelineEvent): string {
    // `summary` uses a sentinel like `progress.timeline.skill:listen`. The
    // host component resolves it through i18n.t() before forwarding; this
    // component treats whatever string arrives as already-human-readable.
    return event.summary;
  }

  protected formatTime(iso: string): string {
    const parsed = Date.parse(iso);
    if (Number.isNaN(parsed)) return iso;
    const d = new Date(parsed);
    const tag = this.locale === 'pt' ? 'pt-BR' : 'en-US';
    return d.toLocaleString(tag, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected deltaDirection(delta: number): 'up' | 'down' | 'flat' {
    if (delta > 0.001) return 'up';
    if (delta < -0.001) return 'down';
    return 'flat';
  }

  protected deltaLabelFor(delta: number): string {
    const dir = this.deltaDirection(delta);
    const magnitude = Math.abs(delta);
    const percent = Math.round(magnitude * 100);
    switch (dir) {
      case 'up':
        return `${this.labels.scoreDeltaUp} ${percent}%`;
      case 'down':
        return `${this.labels.scoreDeltaDown} ${percent}%`;
      case 'flat':
        return this.labels.scoreDeltaFlat;
    }
  }
}
