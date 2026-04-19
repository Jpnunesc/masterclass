import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  output,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';

import { I18nService } from '@shared/i18n';
import { ToastService } from '@shared/ui';

import { ProfileStateService } from './profile-state.service';
import { TEACHERS, type Teacher } from './profile.types';

@Component({
  selector: 'mc-change-teacher-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mc-modal-backdrop"
      role="presentation"
      (click)="onBackdrop($event)"
    >
      <div
        #dialog
        class="mc-modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        (keydown)="onKey($event)"
      >
        <header class="mc-modal__header">
          <div>
            <p class="mc-modal__eyebrow">
              {{ i18n.t('profile.teacher.modalEyebrow') }}
            </p>
            <h2 class="mc-modal__title" [id]="titleId">
              {{ i18n.t('profile.teacher.modalTitle') }}
            </h2>
          </div>
          <button
            type="button"
            class="mc-modal__close"
            [attr.aria-label]="i18n.t('common.modal.close')"
            (click)="emitCancel()"
          >
            <svg
              class="mc-modal__close-icon"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
              focusable="false"
            >
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </header>

        <div
          class="mc-teacher-grid"
          role="radiogroup"
          [attr.aria-labelledby]="titleId"
          (keydown)="onGroupKey($event)"
        >
          @for (option of teachers; track option.id; let i = $index) {
            <button
              #card
              type="button"
              role="radio"
              class="mc-teacher-card"
              [class.mc-teacher-card--selected]="selected() === option.id"
              [attr.aria-checked]="selected() === option.id"
              [attr.aria-describedby]="introId(option.id)"
              [attr.tabindex]="tabindexFor(option.id, i)"
              (click)="pick(option.id)"
            >
              <div
                class="mc-teacher-card__portrait"
                role="img"
                [attr.aria-label]="i18n.t(option.portraitAltKey)"
              >
                <span class="mc-teacher-card__monogram" aria-hidden="true">
                  {{ i18n.t(option.nameKey).charAt(0) }}
                </span>
              </div>
              <h3 class="mc-teacher-card__name">
                {{ i18n.t(option.nameKey) }}
              </h3>
              <p class="mc-teacher-card__intro" [id]="introId(option.id)">
                {{ i18n.t(option.introKey) }}
              </p>
              @if (selected() === option.id) {
                <span class="mc-teacher-card__flag">
                  {{ i18n.t('onboarding.step2.selected') }}
                </span>
              }
            </button>
          }
        </div>

        @if (discardPrompt()) {
          <p class="mc-modal__discard">
            <span>{{ i18n.t('profile.teacher.discardPrompt') }}</span>
            <button
              type="button"
              class="mc-modal__link"
              (click)="confirmDiscard()"
            >
              {{ i18n.t('profile.teacher.discardYes') }}
            </button>
            <button
              type="button"
              class="mc-modal__link"
              (click)="cancelDiscard()"
            >
              {{ i18n.t('profile.teacher.discardNo') }}
            </button>
          </p>
        }

        @if (errorMessage()) {
          <p class="mc-modal__error" role="alert">
            {{ errorMessage() }}
          </p>
        }

        <footer class="mc-modal__footer">
          <button
            type="button"
            class="mc-btn mc-btn-ghost"
            (click)="emitCancel()"
          >
            {{ i18n.t('common.modal.cancel') }}
          </button>
          <button
            #saveBtn
            type="button"
            class="mc-btn mc-btn-primary"
            [disabled]="!canSave()"
            [attr.aria-disabled]="!canSave()"
            (click)="save()"
          >
            {{ i18n.t('profile.teacher.modalSave') }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-modal-backdrop {
        position: fixed;
        inset: 0;
        background: color-mix(in srgb, var(--mc-ink) 50%, transparent);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--mc-space-6);
        z-index: 50;
      }
      .mc-modal {
        width: min(720px, 100%);
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-lg);
        padding: var(--mc-space-8);
        box-shadow: 0 24px 56px rgba(31, 30, 29, 0.22);
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-6);
        max-height: calc(100dvh - var(--mc-space-12));
        overflow: auto;
      }
      @media (max-width: 47.99rem) {
        .mc-modal {
          padding: var(--mc-space-6);
          gap: var(--mc-space-5);
        }
      }
      .mc-modal__header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: var(--mc-space-4);
      }
      .mc-modal__eyebrow {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-modal__title {
        margin: var(--mc-space-2) 0 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-display-md);
        font-weight: 400;
        line-height: var(--mc-lh-tight);
        letter-spacing: var(--mc-tracking-tight);
      }
      .mc-modal__close {
        border: 0;
        background: transparent;
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-heading-lg);
        line-height: 1;
        padding: var(--mc-space-1) var(--mc-space-2);
        border-radius: var(--mc-radius-sm);
        cursor: pointer;
      }
      .mc-modal__close:hover,
      .mc-modal__close:focus-visible {
        background: var(--mc-accent-soft);
        color: var(--mc-ink);
      }
      .mc-modal__close-icon {
        stroke: currentColor;
        stroke-width: 1.5;
        stroke-linecap: round;
        fill: none;
      }
      .mc-teacher-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--mc-space-6);
      }
      @media (max-width: 47.99rem) {
        .mc-teacher-grid {
          grid-template-columns: 1fr;
          gap: var(--mc-space-4);
        }
      }
      .mc-teacher-card {
        display: flex;
        flex-direction: column;
        text-align: left;
        padding: var(--mc-space-6);
        border: 1px solid var(--mc-line);
        background: var(--mc-bg);
        border-radius: var(--mc-radius-lg);
        color: var(--mc-ink);
        font: inherit;
        cursor: pointer;
        transition:
          background var(--mc-dur-2) var(--mc-ease-standard),
          border-color var(--mc-dur-2) var(--mc-ease-standard);
      }
      .mc-teacher-card:hover {
        border-color: var(--mc-line-strong);
      }
      .mc-teacher-card--selected {
        background: var(--mc-accent-soft);
        border-color: var(--mc-line-strong);
      }
      .mc-teacher-card__portrait {
        aspect-ratio: 3 / 4;
        background: var(--mc-bg-inset);
        border-radius: var(--mc-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--mc-space-4);
      }
      .mc-teacher-card__monogram {
        font-family: var(--mc-font-display);
        font-size: 4rem;
        color: var(--mc-ink-muted);
        line-height: 1;
      }
      .mc-teacher-card__name {
        margin: 0;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-heading-md);
        font-weight: 500;
      }
      .mc-teacher-card__intro {
        margin: var(--mc-space-2) 0 0;
        font-size: var(--mc-fs-body-md);
        color: var(--mc-ink-muted);
      }
      .mc-teacher-card__flag {
        margin-top: var(--mc-space-3);
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-accent);
      }
      .mc-modal__discard {
        margin: 0;
        padding: var(--mc-space-3) var(--mc-space-4);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-sm);
        display: flex;
        gap: var(--mc-space-3);
        align-items: center;
        flex-wrap: wrap;
      }
      .mc-modal__link {
        border: 0;
        background: transparent;
        padding: 0;
        font: inherit;
        font-size: inherit;
        color: var(--mc-accent);
        cursor: pointer;
        text-decoration: underline;
      }
      .mc-modal__error {
        margin: 0;
        color: var(--mc-status-danger);
        font-size: var(--mc-fs-body-sm);
      }
      .mc-modal__footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--mc-space-3);
      }
    `
  ]
})
export class ChangeTeacherModalComponent implements AfterViewInit {
  protected readonly i18n = inject(I18nService);
  private readonly state = inject(ProfileStateService);
  private readonly toasts = inject(ToastService);

  readonly closed = output<void>();

  protected readonly teachers = TEACHERS;
  protected readonly titleId = 'mc-teacher-modal-title';

  protected readonly selected = signal<Teacher>(this.state.teacher());
  protected readonly saving = signal(false);
  protected readonly discardPrompt = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly cardEls = viewChildren<ElementRef<HTMLButtonElement>>('card');
  private readonly saveBtn = viewChild<ElementRef<HTMLButtonElement>>('saveBtn');
  private readonly dialogEl = viewChild<ElementRef<HTMLElement>>('dialog');

  protected readonly canSave = computed(
    () => !this.saving() && this.selected() !== this.state.teacher()
  );

  ngAfterViewInit(): void {
    queueMicrotask(() => this.focusCurrentTeacher());
  }

  protected introId(id: Teacher): string {
    return `mc-teacher-modal-${id}-intro`;
  }

  protected tabindexFor(id: Teacher, index: number): number {
    const current = this.selected();
    return current === id ? 0 : index === 0 ? -1 : -1;
  }

  protected pick(id: Teacher): void {
    this.selected.set(id);
    this.errorMessage.set(null);
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.attemptClose();
    }
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.attemptClose();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  protected onGroupKey(event: KeyboardEvent): void {
    const { key } = event;
    if (
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'ArrowUp' &&
      key !== 'ArrowDown' &&
      key !== ' '
    ) {
      return;
    }
    event.preventDefault();
    const items = this.cardEls();
    if (items.length === 0) return;
    const idx = this.teachers.findIndex((t) => t.id === this.selected());
    if (key === ' ') {
      this.pick(this.teachers[idx].id);
      return;
    }
    const delta = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
    const next = (idx + delta + items.length) % items.length;
    this.pick(this.teachers[next].id);
    items[next].nativeElement.focus();
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onDocEscape(event: KeyboardEvent): void {
    event.preventDefault();
    this.attemptClose();
  }

  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    this.errorMessage.set(null);
    const next = this.selected();
    const previous = this.state.teacher();
    try {
      await this.state.saveTeacher(next);
      this.state.setTeacher(next);
      const nameKey = TEACHERS.find((t) => t.id === next)?.nameKey;
      const teacherName = nameKey ? this.i18n.t(nameKey) : '';
      this.toasts.show({
        message: this.i18n.t('profile.toast.teacherSaved', {
          teacher: teacherName
        }),
        variant: 'success'
      });
      this.closed.emit();
    } catch {
      this.state.setTeacher(previous);
      this.errorMessage.set(this.i18n.t('profile.toast.teacherError'));
    } finally {
      this.saving.set(false);
    }
  }

  protected confirmDiscard(): void {
    this.discardPrompt.set(false);
    this.closed.emit();
  }

  protected cancelDiscard(): void {
    this.discardPrompt.set(false);
    queueMicrotask(() => this.saveBtn()?.nativeElement.focus());
  }

  protected emitCancel(): void {
    this.attemptClose();
  }

  private attemptClose(): void {
    if (this.canSave()) {
      this.discardPrompt.set(true);
      return;
    }
    this.closed.emit();
  }

  private focusCurrentTeacher(): void {
    const current = this.selected();
    const idx = this.teachers.findIndex((t) => t.id === current);
    if (idx < 0) return;
    this.cardEls()[idx]?.nativeElement.focus();
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = this.dialogEl()?.nativeElement;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
