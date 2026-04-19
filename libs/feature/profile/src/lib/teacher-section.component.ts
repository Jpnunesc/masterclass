import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';

import { I18nService } from '@shared/i18n';

import { ChangeTeacherModalComponent } from './change-teacher-modal.component';
import { ProfileStateService } from './profile-state.service';

@Component({
  selector: 'mc-profile-teacher',
  standalone: true,
  imports: [ChangeTeacherModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mc-profile-section"
      [attr.aria-labelledby]="titleId"
    >
      <header class="mc-profile-section__head">
        <p class="mc-profile-section__eyebrow">
          {{ i18n.t('profile.teacher.eyebrow') }}
        </p>
        <h2 class="mc-profile-section__title" [id]="titleId">
          {{ i18n.t('profile.teacher.title') }}
        </h2>
      </header>

      <div class="mc-profile-section__body mc-teacher-body">
        <div
          class="mc-teacher-body__portrait"
          role="img"
          [attr.aria-label]="i18n.t(currentTeacher().portraitAltKey)"
        >
          <span class="mc-teacher-body__monogram" aria-hidden="true">
            {{ currentInitial() }}
          </span>
        </div>
        <div class="mc-teacher-body__meta">
          <p class="mc-teacher-body__name">
            {{ i18n.t(currentTeacher().nameKey) }}
          </p>
          <p class="mc-teacher-body__intro">
            {{ i18n.t(currentTeacher().introKey) }}
          </p>
          <button
            #changeBtn
            type="button"
            class="mc-btn mc-btn-secondary"
            (click)="openModal()"
          >
            {{ i18n.t('profile.teacher.change') }}
          </button>
        </div>
      </div>

      <hr class="mc-profile-section__rule" aria-hidden="true" />
    </section>

    @if (modalOpen()) {
      <mc-change-teacher-modal (closed)="closeModal()" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-profile-section__head {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-profile-section__eyebrow {
        margin: 0;
        font-size: var(--mc-fs-caption);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--mc-ink-muted);
      }
      .mc-profile-section__title {
        margin: 0;
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-display-md);
        font-weight: 400;
        line-height: var(--mc-lh-tight);
        letter-spacing: var(--mc-tracking-tight);
        color: var(--mc-ink);
      }
      @media (max-width: 47.99rem) {
        .mc-profile-section__title {
          font-size: var(--mc-fs-heading-lg);
        }
      }
      .mc-profile-section__body {
        margin-top: var(--mc-space-6);
      }
      .mc-profile-section__rule {
        margin: var(--mc-space-12) 0 0;
        border: 0;
        border-top: 1px solid var(--mc-line);
      }
      .mc-teacher-body {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: var(--mc-space-5);
        align-items: start;
      }
      @media (max-width: 47.99rem) {
        .mc-teacher-body {
          grid-template-columns: 88px 1fr;
          gap: var(--mc-space-4);
        }
      }
      .mc-teacher-body__portrait {
        aspect-ratio: 3 / 4;
        background: var(--mc-bg-inset);
        border: 1px solid var(--mc-line);
        border-radius: var(--mc-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .mc-teacher-body__monogram {
        font-family: var(--mc-font-display);
        font-size: 3rem;
        color: var(--mc-ink-muted);
        line-height: 1;
      }
      .mc-teacher-body__meta {
        display: flex;
        flex-direction: column;
        gap: var(--mc-space-2);
      }
      .mc-teacher-body__name {
        margin: 0;
        font-family: var(--mc-font-body);
        font-size: var(--mc-fs-heading-md);
        font-weight: 500;
        color: var(--mc-ink);
      }
      .mc-teacher-body__intro {
        margin: 0;
        font-size: var(--mc-fs-body-md);
        color: var(--mc-ink-muted);
      }
      .mc-teacher-body__meta .mc-btn {
        align-self: flex-start;
        margin-top: var(--mc-space-4);
      }
      @media (max-width: 47.99rem) {
        .mc-teacher-body__meta .mc-btn {
          align-self: stretch;
        }
      }
    `
  ]
})
export class TeacherSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly state = inject(ProfileStateService);

  protected readonly titleId = 'mc-profile-teacher-title';
  protected readonly modalOpen = signal(false);

  private readonly changeBtn =
    viewChild<ElementRef<HTMLButtonElement>>('changeBtn');

  protected readonly currentTeacher = computed(() => this.state.currentTeacher());

  protected readonly currentInitial = computed(() =>
    this.i18n.t(this.currentTeacher().nameKey).charAt(0)
  );

  protected openModal(): void {
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
    queueMicrotask(() => this.changeBtn()?.nativeElement.focus());
  }
}
