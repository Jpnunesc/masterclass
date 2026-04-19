import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import type { AssessmentPhase } from '../domain/assessment.types';

@Component({
  selector: 'mc-teacher-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="mc-avatar" [attr.data-phase]="phase" [attr.aria-label]="label">
      <span class="mc-avatar-face" aria-hidden="true">
        <span class="mc-avatar-eye mc-avatar-eye--left"></span>
        <span class="mc-avatar-eye mc-avatar-eye--right"></span>
        <span class="mc-avatar-mouth" [attr.data-phase]="phase"></span>
      </span>
      <figcaption class="mc-avatar-caption">{{ caption }}</figcaption>
    </figure>
  `,
  styles: [
    `
      .mc-avatar {
        display: grid;
        gap: var(--mc-space-3);
        justify-items: center;
        margin: 0;
      }
      .mc-avatar-face {
        position: relative;
        width: 6rem;
        height: 6rem;
        border-radius: 50%;
        background: var(--mc-surface-raised);
        border: 1px solid var(--mc-border-strong);
        display: block;
      }
      .mc-avatar[data-phase='thinking'] .mc-avatar-face {
        animation: mc-avatar-pulse 1.4s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-avatar[data-phase='thinking'] .mc-avatar-face {
          animation: none;
        }
      }
      .mc-avatar-eye {
        position: absolute;
        top: 38%;
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 50%;
        background: var(--mc-text-primary);
      }
      .mc-avatar-eye--left { left: 30%; }
      .mc-avatar-eye--right { right: 30%; }
      .mc-avatar-mouth {
        position: absolute;
        bottom: 26%;
        left: 50%;
        transform: translateX(-50%);
        width: 1.6rem;
        height: 0.35rem;
        border-radius: 9999px;
        background: var(--mc-text-primary);
      }
      .mc-avatar-mouth[data-phase='listening'] { height: 0.75rem; border-radius: 0.4rem; }
      .mc-avatar-mouth[data-phase='completed'] { width: 1.2rem; border-radius: 9999px; }
      .mc-avatar-caption {
        max-width: 28rem;
        text-align: center;
        color: var(--mc-text-secondary);
        font-family: var(--mc-font-display);
        font-size: var(--mc-fs-body-lg);
        line-height: 1.35;
      }
      @keyframes mc-avatar-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `
  ]
})
export class TeacherAvatarComponent {
  @Input({ required: true }) phase!: AssessmentPhase;
  @Input({ required: true }) caption!: string;
  @Input({ required: true }) label!: string;
}
