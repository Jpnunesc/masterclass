import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { AvatarState } from './classroom.types';

/**
 * Portrait frame for the classroom teacher. The component only renders the
 * current `state`; transitions are owned by the session service. Sprites are
 * placeholder SVG until the illustrator delivers the 8-pose asset pack (see
 * states-gallery §6).
 */
@Component({
  selector: 'mc-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mc-avatar"
      role="img"
      [attr.data-state]="state()"
      [attr.aria-labelledby]="captionId()"
    >
      <div class="mc-avatar__frame">
        <svg
          class="mc-avatar__portrait"
          viewBox="0 0 320 426"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient id="mc-avatar-halo" cx="0.5" cy="0.5" r="0.55">
              <stop offset="0%" stop-color="var(--mc-accent-soft)" stop-opacity="0.9" />
              <stop offset="100%" stop-color="var(--mc-accent-soft)" stop-opacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="426" fill="var(--mc-bg-inset)" rx="18" />
          <circle class="mc-avatar__halo" cx="160" cy="200" r="180" fill="url(#mc-avatar-halo)" />
          <g class="mc-avatar__silhouette" transform="translate(0, 40)">
            <circle cx="160" cy="150" r="70" fill="var(--mc-ink-muted)" opacity="0.85" />
            <path
              d="M 60 320 Q 60 250 160 250 Q 260 250 260 320 L 260 360 L 60 360 Z"
              fill="var(--mc-ink-muted)"
              opacity="0.85"
            />
            <circle class="mc-avatar__eye mc-avatar__eye--left" cx="140" cy="148" r="4" fill="var(--mc-ink)" />
            <circle class="mc-avatar__eye mc-avatar__eye--right" cx="180" cy="148" r="4" fill="var(--mc-ink)" />
            <path class="mc-avatar__mouth" d="M 146 180 Q 160 188 174 180" stroke="var(--mc-ink)" stroke-width="2" fill="none" stroke-linecap="round" />
          </g>
        </svg>
        <span class="mc-avatar__thinking-dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mc-avatar {
        position: relative;
        width: 100%;
        aspect-ratio: 3 / 4;
      }
      .mc-avatar__frame {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 18px;
        overflow: hidden;
        background: var(--mc-bg-inset);
        box-shadow: var(--mc-elev-1);
        border: 1px solid var(--mc-line);
      }
      .mc-avatar__portrait {
        width: 100%;
        height: 100%;
        display: block;
      }
      .mc-avatar__halo {
        opacity: 0;
        transition: opacity var(--mc-dur-3) var(--mc-ease-standard);
      }
      [data-state='listening'] .mc-avatar__halo {
        opacity: 0.6;
      }
      [data-state='speaking'] .mc-avatar__halo {
        opacity: 0.55;
        animation: mc-avatar-pulse 1.6s var(--mc-ease-standard) infinite;
      }
      [data-state='encouraging'] .mc-avatar__halo {
        opacity: 0.7;
      }
      [data-state='thinking'] .mc-avatar__silhouette .mc-avatar__eye {
        transform: translateY(-2px);
        transform-origin: center;
        transition: transform var(--mc-dur-2) var(--mc-ease-standard);
      }
      [data-state='speaking'] .mc-avatar__mouth {
        animation: mc-avatar-lipsync 0.6s var(--mc-ease-standard) infinite;
      }
      [data-state='encouraging'] .mc-avatar__mouth {
        d: path('M 140 180 Q 160 198 180 180');
      }
      [data-state='correcting'] .mc-avatar__frame {
        outline: 2px solid var(--mc-status-danger);
        outline-offset: -2px;
      }
      [data-state='correcting'] .mc-avatar__mouth {
        d: path('M 146 186 Q 160 186 174 186');
      }
      [data-state='offline'] {
        filter: grayscale(0.65);
      }
      [data-state='offline'] .mc-avatar__frame {
        opacity: 0.6;
      }
      [data-state='idle'] .mc-avatar__frame {
        animation: mc-avatar-breathe 3s var(--mc-ease-standard) infinite;
      }
      .mc-avatar__thinking-dots {
        position: absolute;
        left: var(--mc-space-3);
        bottom: var(--mc-space-3);
        display: none;
        gap: 4px;
      }
      [data-state='thinking'] .mc-avatar__thinking-dots {
        display: inline-flex;
      }
      .mc-avatar__thinking-dots span {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: var(--mc-ink-muted);
        animation: mc-avatar-dot 1.2s var(--mc-ease-standard) infinite;
      }
      .mc-avatar__thinking-dots span:nth-child(2) {
        animation-delay: 200ms;
      }
      .mc-avatar__thinking-dots span:nth-child(3) {
        animation-delay: 400ms;
      }

      @keyframes mc-avatar-breathe {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.004);
        }
      }
      @keyframes mc-avatar-pulse {
        0%, 100% {
          opacity: 0.2;
        }
        50% {
          opacity: 0.8;
        }
      }
      @keyframes mc-avatar-lipsync {
        0%, 100% {
          transform: scaleY(1);
          transform-origin: center;
        }
        50% {
          transform: scaleY(0.35);
          transform-origin: center;
        }
      }
      @keyframes mc-avatar-dot {
        0%, 100% {
          opacity: 0.4;
        }
        50% {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-avatar__halo,
        .mc-avatar__mouth,
        .mc-avatar__thinking-dots span,
        [data-state='idle'] .mc-avatar__frame {
          animation: none !important;
        }
      }
    `
  ]
})
export class AvatarComponent {
  readonly state = input.required<AvatarState>();
  readonly captionId = input<string>('mc-avatar-caption');
}
