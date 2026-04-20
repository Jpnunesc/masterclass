import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { I18nService } from '@shared/i18n';

import { AvatarColumnComponent } from './avatar-column.component';
import { ChatColumnComponent } from './chat-column.component';
import { ClassroomChromeService } from './classroom-chrome.service';
import { ClassroomSessionService } from './classroom-session.service';
import { ClassroomStatusStripComponent } from './status-strip.component';
import { WhiteboardColumnComponent } from './whiteboard-column.component';

@Component({
  selector: 'mc-classroom',
  standalone: true,
  imports: [
    RouterLink,
    AvatarColumnComponent,
    WhiteboardColumnComponent,
    ChatColumnComponent,
    ClassroomStatusStripComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (session.connectionState() !== 'ok') {
      <mc-classroom-status-strip [connection]="session.connectionState()" />
    }

    <div class="mc-classroom" [attr.data-layout]="layoutMode()">
      @if (layoutMode() === 'sm') {
        <div
          class="mc-classroom__tabs"
          role="tablist"
          [attr.aria-label]="i18n.t('classroom.aria.tabs')"
        >
          <button
            type="button"
            role="tab"
            class="mc-classroom__tab"
            [class.is-active]="mobileView() === 'whiteboard'"
            [attr.aria-selected]="mobileView() === 'whiteboard'"
            (click)="mobileView.set('whiteboard')"
          >
            {{ i18n.t('classroom.aria.whiteboard') }}
          </button>
          <button
            type="button"
            role="tab"
            class="mc-classroom__tab"
            [class.is-active]="mobileView() === 'transcript'"
            [attr.aria-selected]="mobileView() === 'transcript'"
            (click)="mobileView.set('transcript')"
          >
            {{ i18n.t('classroom.drawer.open') }}
          </button>
        </div>
      }

      <aside
        class="mc-classroom__avatar"
        [attr.aria-label]="i18n.t('classroom.aria.avatar')"
      >
        <mc-avatar-column
          [avatarState]="session.avatarState()"
          [micState]="session.micState()"
          [teacherNameKey]="session.teacher().nameKey"
          [lessonTitleKey]="session.lesson().titleKey"
          [elapsedMinutes]="session.elapsedMinutes()"
          [level]="session.lesson().level"
          (micToggle)="onMicToggle()"
        />
      </aside>

      <section
        class="mc-classroom__board"
        [hidden]="layoutMode() === 'sm' && mobileView() !== 'whiteboard'"
      >
        <mc-whiteboard-column
          [cards]="session.cards()"
          [lessonTitleKey]="session.lesson().titleKey"
          [objectiveKey]="session.lesson().objectiveKey"
          (submitExercise)="onSubmitExercise($event)"
        >
          @if (layoutMode() === 'md') {
            <button
              slot="board-trailing"
              type="button"
              class="mc-classroom__drawer-trigger"
              [attr.aria-label]="i18n.t('classroom.drawer.open')"
              [attr.aria-expanded]="drawerOpen()"
              aria-controls="mc-classroom-drawer"
              (click)="toggleDrawer()"
            >
              <span>{{ i18n.t('classroom.drawer.open') }}</span>
              @if (unreadSystemCount() > 0) {
                <span
                  class="mc-classroom__drawer-badge"
                  [attr.aria-label]="
                    i18n.t('classroom.drawer.unread', { count: unreadSystemCount() })
                  "
                >
                  {{ unreadSystemCount() }}
                </span>
              }
            </button>
          }
        </mc-whiteboard-column>
      </section>

      <section
        class="mc-classroom__chat"
        [hidden]="layoutMode() === 'sm' && mobileView() !== 'transcript'"
      >
        <mc-chat-column
          [turns]="session.turns()"
          [inputOpen]="chatInputOpen()"
          (openInputClick)="chatInputOpen.set(true)"
          (closeInputClick)="chatInputOpen.set(false)"
          (submitMessage)="onChatSubmit($event)"
        />
      </section>

      @if (layoutMode() === 'md' && drawerOpen()) {
        <div
          class="mc-classroom__drawer-backdrop"
          aria-hidden="true"
          (click)="closeDrawer()"
        ></div>
        <aside
          id="mc-classroom-drawer"
          class="mc-classroom__drawer"
          role="dialog"
          aria-modal="false"
          [attr.aria-label]="i18n.t('classroom.aria.transcript')"
        >
          <mc-chat-column
            [turns]="session.turns()"
            [inputOpen]="chatInputOpen()"
            (openInputClick)="chatInputOpen.set(true)"
            (closeInputClick)="chatInputOpen.set(false)"
            (submitMessage)="onChatSubmit($event)"
          />
        </aside>
      }

      <a
        routerLink="/classroom/states-gallery"
        class="mc-classroom__gallery-link"
      >
        {{ i18n.t('classroom.gallery.link') }}
      </a>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: calc(100dvh - var(--mc-shell-header-h));
        background: var(--mc-bg);
      }
      .mc-classroom {
        display: grid;
        grid-template-columns: 320px 1fr 360px;
        gap: var(--mc-space-6);
        padding: var(--mc-space-6);
        min-height: calc(100dvh - var(--mc-shell-header-h));
        position: relative;
      }
      .mc-classroom__avatar,
      .mc-classroom__board,
      .mc-classroom__chat {
        min-height: 0;
      }
      .mc-classroom__board {
        background: var(--mc-bg);
      }
      .mc-classroom__chat {
        background: var(--mc-bg);
        border-inline-start: 1px solid var(--mc-line);
        padding-inline-start: var(--mc-space-4);
      }
      .mc-classroom__gallery-link {
        position: fixed;
        bottom: var(--mc-space-3);
        inset-inline-end: var(--mc-space-3);
        font-size: var(--mc-fs-caption);
        color: var(--mc-ink-muted);
        text-decoration: none;
        padding: var(--mc-space-1) var(--mc-space-2);
        border: 1px dashed var(--mc-line);
        border-radius: var(--mc-radius-sm);
        background: var(--mc-bg-raised);
      }
      .mc-classroom__gallery-link:focus-visible {
        outline: 2px solid var(--mc-accent);
      }
      .mc-classroom__tabs {
        display: none;
      }
      .mc-classroom__tab {
        flex: 1;
        padding: var(--mc-space-2) var(--mc-space-3);
        background: transparent;
        border: 0;
        border-block-end: 2px solid transparent;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
        cursor: pointer;
      }
      .mc-classroom__tab.is-active {
        color: var(--mc-ink);
        border-block-end-color: var(--mc-accent);
      }
      .mc-classroom__tab:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 2px;
      }
      .mc-classroom__drawer-trigger {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-2);
        padding: var(--mc-space-1) var(--mc-space-3);
        background: var(--mc-bg-raised);
        color: var(--mc-ink);
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-pill);
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-caption);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .mc-classroom__drawer-trigger:focus-visible {
        outline: 2px solid var(--mc-accent);
        outline-offset: 2px;
      }
      .mc-classroom__drawer-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 var(--mc-space-1);
        border-radius: var(--mc-radius-pill);
        background: var(--mc-accent-600);
        color: var(--mc-accent-ink);
        font-size: var(--mc-fs-caption);
        font-weight: 700;
        letter-spacing: 0;
        text-transform: none;
      }
      .mc-classroom__drawer-backdrop {
        position: fixed;
        inset: 0;
        background: color-mix(in srgb, var(--mc-ink) 32%, transparent);
        z-index: 40;
        animation: mc-classroom-fade var(--mc-dur-2) var(--mc-ease-enter);
      }
      .mc-classroom__drawer {
        position: fixed;
        inset-block: 0;
        inset-inline-end: 0;
        width: 360px;
        max-width: 100vw;
        background: var(--mc-bg);
        border-inline-start: 1px solid var(--mc-line);
        box-shadow: var(--mc-elev-2);
        z-index: 41;
        display: flex;
        flex-direction: column;
        animation: mc-classroom-slide-in var(--mc-dur-3) var(--mc-ease-enter);
      }
      @keyframes mc-classroom-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes mc-classroom-slide-in {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-classroom__drawer,
        .mc-classroom__drawer-backdrop {
          animation: none;
        }
      }
      @media (max-width: 1024px) {
        .mc-classroom {
          grid-template-columns: 240px 1fr;
        }
        .mc-classroom__chat {
          display: none;
        }
      }
      @media (max-width: 48rem) {
        .mc-classroom {
          grid-template-columns: 1fr;
          padding: var(--mc-space-4);
        }
        .mc-classroom__chat {
          display: block;
        }
        .mc-classroom__tabs {
          display: flex;
          border-block-end: 1px solid var(--mc-line);
          margin-block-end: var(--mc-space-3);
        }
      }
    `
  ]
})
export class ClassroomComponent implements OnInit, OnDestroy {
  protected readonly i18n = inject(I18nService);
  protected readonly session = inject(ClassroomSessionService);
  private readonly chrome = inject(ClassroomChromeService);
  private readonly route = inject(ActivatedRoute);

  protected readonly chatInputOpen = signal(false);
  protected readonly mobileView = signal<'whiteboard' | 'transcript'>('whiteboard');
  protected readonly drawerOpen = signal(false);
  private readonly lastSeenSystemCount = signal(0);

  private readonly viewportWidth = signal<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  protected readonly layoutMode = computed<'lg' | 'md' | 'sm'>(() => {
    const w = this.viewportWidth();
    if (w >= 1024) return 'lg';
    if (w >= 768) return 'md';
    return 'sm';
  });

  private readonly systemTurnCount = computed(
    () => this.session.turns().filter((t) => t.role === 'system').length
  );
  protected readonly unreadSystemCount = computed(() =>
    Math.max(0, this.systemTurnCount() - this.lastSeenSystemCount())
  );

  constructor() {
    effect(() => {
      if (this.drawerOpen()) {
        this.lastSeenSystemCount.set(this.systemTurnCount());
      }
    });
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId') ?? 'demo';
    this.session.loadSession(sessionId);
    this.chrome.setActive(this.session.lesson());
  }

  ngOnDestroy(): void {
    this.chrome.clear();
  }

  onMicToggle(): void {
    this.session.toggleMic();
  }

  onSubmitExercise(event: { id: string; answer: string }): void {
    this.session.submitExercise(event.id, event.answer);
  }

  onChatSubmit(text: string): void {
    this.session.addStudentTurn(text);
    this.chatInputOpen.set(false);
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKey(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    const isTyping =
      !!target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable);
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      if (this.chatInputOpen()) {
        this.chatInputOpen.set(false);
        event.preventDefault();
        return;
      }
      if (this.drawerOpen()) {
        this.drawerOpen.set(false);
        event.preventDefault();
        return;
      }
      this.session.cancelMic();
      return;
    }
    if (isTyping) return;
    if (key === 'm') {
      event.preventDefault();
      this.session.toggleMic();
    } else if (key === '/') {
      event.preventDefault();
      this.chatInputOpen.set(true);
    }
  }
}
