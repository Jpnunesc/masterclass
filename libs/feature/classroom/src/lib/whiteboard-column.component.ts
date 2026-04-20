import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';

import { I18nService, type I18nKey } from '@shared/i18n';

import { WhiteboardCardComponent } from './whiteboard-card.component';
import type { BoardCard } from './classroom.types';

const NEAR_BOTTOM_PX = 120;

@Component({
  selector: 'mc-whiteboard-column',
  standalone: true,
  imports: [WhiteboardCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-board"
      role="region"
      [attr.aria-label]="i18n.t('classroom.aria.whiteboard')"
    >
      <header class="mc-board__header">
        <h1 class="mc-board__title">{{ i18n.t(lessonTitleKey()) }}</h1>
        <div class="mc-board__header-trailing">
          <ng-content select="[slot='board-trailing']" />
        </div>
      </header>

      <ol class="mc-board__cards" role="list" #stream (scroll)="onScroll()">
        @for (card of cards(); track card.id) {
          <li class="mc-board__card-row">
            <mc-whiteboard-card
              [card]="card"
              (submitExercise)="submitExercise.emit($event)"
            />
          </li>
        }
      </ol>

      @if (showJumpPill()) {
        <button
          type="button"
          class="mc-board__pill"
          (click)="jumpToLatest()"
        >
          {{ i18n.t('classroom.board.new_note') }}
        </button>
      }

      <footer class="mc-board__footer">
        <p class="mc-board__objective">
          {{ i18n.t('classroom.objective', { objective: i18n.t(objectiveKey()) }) }}
        </p>
      </footer>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }
      .mc-board {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr auto;
        row-gap: var(--mc-space-4);
        height: 100%;
      }
      .mc-board__header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--mc-space-3);
        padding-inline: var(--mc-space-2);
      }
      .mc-board__header-trailing {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-2);
      }
      .mc-board__header-trailing:empty {
        display: none;
      }
      .mc-board__title {
        margin: 0;
        font: var(--mc-type-display-md);
        letter-spacing: var(--mc-tracking-display);
        color: var(--mc-ink);
      }
      .mc-board__cards {
        list-style: none;
        margin: 0;
        padding: var(--mc-space-2);
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-5);
        overflow-y: auto;
        scrollbar-gutter: stable;
        min-height: 0;
      }
      .mc-board__card-row {
        display: flex;
      }
      .mc-board__pill {
        position: absolute;
        inset-inline-end: var(--mc-space-4);
        bottom: 72px;
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-pill);
        padding: var(--mc-space-1) var(--mc-space-3);
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: var(--mc-elev-2);
      }
      .mc-board__pill:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 2px;
      }
      .mc-board__footer {
        padding-inline: var(--mc-space-2);
      }
      .mc-board__objective {
        margin: 0;
        font-size: var(--mc-fs-body-sm);
        color: var(--mc-ink-muted);
      }
    `
  ]
})
export class WhiteboardColumnComponent implements AfterViewInit, OnDestroy {
  protected readonly i18n = inject(I18nService);

  readonly cards = input.required<readonly BoardCard[]>();
  readonly lessonTitleKey = input.required<I18nKey>();
  readonly objectiveKey = input.required<I18nKey>();
  readonly submitExercise = output<{ id: string; answer: string }>();

  protected readonly streamRef = viewChild<ElementRef<HTMLOListElement>>('stream');

  private readonly nearBottom = signal<boolean>(true);
  private readonly pendingUnseen = signal<boolean>(false);
  private readonly lastCount = signal<number>(0);
  private observer: ResizeObserver | null = null;

  readonly showJumpPill = computed(() => !this.nearBottom() && this.pendingUnseen());

  constructor() {
    effect(() => {
      const count = this.cards().length;
      const prev = this.lastCount();
      if (count > prev) {
        queueMicrotask(() => this.handleCardAdded());
      }
      this.lastCount.set(count);
    });
  }

  ngAfterViewInit(): void {
    const el = this.streamRef()?.nativeElement;
    if (el && 'ResizeObserver' in globalThis) {
      this.observer = new ResizeObserver(() => {
        if (this.nearBottom()) this.scrollToBottom();
      });
      this.observer.observe(el);
    }
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onScroll(): void {
    const el = this.streamRef()?.nativeElement;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
    this.nearBottom.set(near);
    if (near) this.pendingUnseen.set(false);
  }

  jumpToLatest(): void {
    this.scrollToBottom();
    this.nearBottom.set(true);
    this.pendingUnseen.set(false);
  }

  private handleCardAdded(): void {
    if (this.nearBottom()) {
      this.scrollToBottom();
    } else {
      this.pendingUnseen.set(true);
    }
  }

  private scrollToBottom(): void {
    const el = this.streamRef()?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }
}
