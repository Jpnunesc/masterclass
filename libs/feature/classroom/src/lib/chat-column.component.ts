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
import { FormsModule } from '@angular/forms';

import { I18nService, type I18nKey } from '@shared/i18n';

import type { TranscriptTurn } from './classroom.types';

const NEAR_BOTTOM_PX = 120;

@Component({
  selector: 'mc-chat-column',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="mc-chat"
      role="complementary"
      [attr.aria-label]="i18n.t('classroom.aria.transcript')"
    >
      <header class="mc-chat__header">
        <p class="mc-chat__eyebrow">{{ i18n.t('classroom.transcript.eyebrow') }}</p>
        @if (inputOpen()) {
          <button
            type="button"
            class="mc-chat__close"
            [attr.aria-label]="i18n.t('classroom.chat.input.close')"
            (click)="closeInput()"
          >
            ×
          </button>
        }
      </header>

      <div class="mc-chat__scroller" #scroller (scroll)="onScroll()">
        @for (turn of turns(); track turn.id) {
          @switch (turn.role) {
            @case ('teacher') {
              <p
                class="mc-turn mc-turn--teacher"
                role="article"
                [attr.aria-label]="teacherAriaLabel(turn.text)"
              >
                {{ turn.text }}
              </p>
            }
            @case ('student') {
              <p
                class="mc-turn mc-turn--student"
                role="article"
                [attr.aria-label]="studentAriaLabel(turn.text)"
              >
                <span class="mc-turn__bubble">{{ turn.text }}</span>
              </p>
            }
            @case ('system') {
              <p class="mc-turn mc-turn--system" role="status">
                {{ systemTurnText(turn.key) }}
              </p>
            }
          }
        }
      </div>

      @if (showJumpPill()) {
        <button
          type="button"
          class="mc-chat__pill"
          (click)="jumpToLatest()"
        >
          {{ i18n.t('classroom.transcript.jump_latest') }}
        </button>
      }

      @if (inputOpen()) {
        <form class="mc-chat__form" (submit)="onSubmitInput($event)">
          <label class="mc-visually-hidden" for="mc-chat-input">
            {{ i18n.t('classroom.chat.input.placeholder') }}
          </label>
          <textarea
            id="mc-chat-input"
            class="mc-chat__input"
            rows="2"
            [placeholder]="i18n.t('classroom.chat.input.placeholder')"
            [(ngModel)]="draft"
            name="mc-chat-input"
            (keydown.enter)="onInputEnter($event)"
            (keydown.escape)="closeInput()"
            #chatInput
          ></textarea>
        </form>
      } @else {
        <button
          type="button"
          class="mc-chat__hint"
          (click)="openInput()"
        >
          {{ i18n.t('classroom.hint.chat') }}
        </button>
      }
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }
      .mc-chat {
        display: grid;
        grid-template-rows: auto 1fr auto;
        height: 100%;
        background: var(--mc-bg);
      }
      .mc-chat__header {
        position: sticky;
        top: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--mc-space-4) var(--mc-space-4) var(--mc-space-2);
        background: var(--mc-bg);
        z-index: 1;
      }
      .mc-chat__eyebrow {
        margin: 0;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-chat__close {
        appearance: none;
        background: transparent;
        border: 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-heading-md);
        cursor: pointer;
        padding: 0 var(--mc-space-2);
      }
      .mc-chat__close:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 2px;
      }
      .mc-chat__scroller {
        overflow-y: auto;
        scrollbar-gutter: stable both-edges;
        padding: 0 var(--mc-space-4);
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-4);
        min-height: 0;
      }
      .mc-turn {
        margin: 0;
        max-width: 100%;
      }
      .mc-turn--teacher {
        font-size: var(--mc-fs-body-lg);
        line-height: 1.55;
        color: var(--mc-ink);
      }
      .mc-turn--student {
        display: flex;
        justify-content: flex-end;
      }
      .mc-turn__bubble {
        display: inline-block;
        max-width: 85%;
        background: var(--mc-bg-inset);
        color: var(--mc-ink);
        padding: var(--mc-space-3) var(--mc-space-4);
        border-radius: var(--mc-radius-lg);
        border-end-end-radius: var(--mc-radius-sm);
        font-size: var(--mc-fs-body-md);
        line-height: 1.5;
      }
      .mc-turn--system {
        text-align: center;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-chat__hint {
        appearance: none;
        background: transparent;
        border: 0;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-sm);
        padding: var(--mc-space-3) var(--mc-space-4);
        text-align: start;
        cursor: pointer;
      }
      .mc-chat__hint:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 2px;
      }
      .mc-chat__form {
        padding: var(--mc-space-3) var(--mc-space-4);
        border-top: 1px solid var(--mc-line);
      }
      .mc-chat__input {
        width: 100%;
        resize: none;
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-md);
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-body-md);
        padding: var(--mc-space-2) var(--mc-space-3);
        outline: none;
      }
      .mc-chat__input:focus {
        border-color: var(--mc-accent);
      }
      .mc-chat__pill {
        position: absolute;
        inset-inline-end: var(--mc-space-4);
        bottom: 64px;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-pill);
        padding: var(--mc-space-1) var(--mc-space-3);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .mc-visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ]
})
export class ChatColumnComponent implements AfterViewInit, OnDestroy {
  protected readonly i18n = inject(I18nService);

  readonly turns = input.required<readonly TranscriptTurn[]>();
  readonly inputOpen = input<boolean>(false);
  readonly openInputClick = output<void>();
  readonly closeInputClick = output<void>();
  readonly submitMessage = output<string>();

  protected draft = signal('');

  private readonly scrollerRef = viewChild<ElementRef<HTMLDivElement>>('scroller');
  private readonly inputRef = viewChild<ElementRef<HTMLTextAreaElement>>('chatInput');
  private readonly nearBottom = signal<boolean>(true);
  private readonly pendingUnseen = signal<boolean>(false);
  private readonly lastCount = signal<number>(0);
  private observer: ResizeObserver | null = null;

  readonly showJumpPill = computed(() => !this.nearBottom() && this.pendingUnseen());

  constructor() {
    effect(() => {
      const count = this.turns().length;
      const prev = this.lastCount();
      if (count > prev) {
        queueMicrotask(() => this.handleTurnAdded());
      }
      this.lastCount.set(count);
    });
    effect(() => {
      if (this.inputOpen()) {
        queueMicrotask(() => this.inputRef()?.nativeElement.focus());
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.scrollerRef()?.nativeElement;
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
    const el = this.scrollerRef()?.nativeElement;
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

  openInput(): void {
    this.openInputClick.emit();
  }

  closeInput(): void {
    this.draft.set('');
    this.closeInputClick.emit();
  }

  onInputEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.shiftKey) return;
    ke.preventDefault();
    this.submit();
  }

  onSubmitInput(event: Event): void {
    event.preventDefault();
    this.submit();
  }

  teacherAriaLabel(text: string): string {
    return this.i18n.t('classroom.chat.turn.teacher_aria', { text });
  }

  studentAriaLabel(text: string): string {
    return this.i18n.t('classroom.chat.turn.student_aria', { text });
  }

  systemTurnText(key: string): string {
    const k = `classroom.transcript.system.${key}` as I18nKey;
    return this.i18n.t(k);
  }

  private submit(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.submitMessage.emit(text);
    this.draft.set('');
  }

  private handleTurnAdded(): void {
    if (this.nearBottom()) {
      this.scrollToBottom();
    } else {
      this.pendingUnseen.set(true);
    }
  }

  private scrollToBottom(): void {
    const el = this.scrollerRef()?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }
}
