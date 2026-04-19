import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  signal,
  viewChild
} from '@angular/core';
import { inject } from '@angular/core';

import {
  I18nService,
  SUPPORTED_LOCALES,
  type I18nKey,
  type SupportedLocale
} from '@shared/i18n';

type LayoutMode = 'pill' | 'row';

@Component({
  selector: 'mc-language-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mc-lang" [class.mc-lang--row]="isRow()">
      @if (isRow()) {
        <span class="mc-lang__row-label">{{ i18n.t('common.locale.label') }}</span>
      }
      <button
        #trigger
        type="button"
        class="mc-lang__trigger"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="currentAria()"
        (click)="togglePopover()"
        (keydown)="onTriggerKey($event)"
      >
        <span class="mc-lang__code">{{ currentCode() }}</span>
        <span class="mc-lang__chevron" aria-hidden="true">▾</span>
      </button>

      @if (open()) {
        <ul
          #menu
          class="mc-lang__menu"
          [class.mc-lang__menu--above]="isRow()"
          role="menu"
          [attr.aria-label]="i18n.t('common.locale.label')"
          (keydown)="onMenuKey($event)"
        >
          @for (loc of locales; track loc; let i = $index) {
            <li role="none">
              <button
                type="button"
                role="menuitemradio"
                class="mc-lang__item"
                [attr.aria-checked]="loc === i18n.locale()"
                [class.mc-lang__item--active]="loc === i18n.locale()"
                [attr.data-index]="i"
                (click)="pick(loc)"
              >
                <span>{{ i18n.t(optionKey(loc)) }}</span>
                @if (loc === i18n.locale()) {
                  <span class="mc-lang__check" aria-hidden="true">✓</span>
                }
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        position: relative;
      }
      .mc-lang {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-3);
      }
      .mc-lang--row {
        display: flex;
        width: 100%;
        justify-content: space-between;
      }
      .mc-lang__row-label {
        color: var(--mc-ink-muted);
        font-size: var(--mc-fs-body-lg);
        order: 2;
      }
      .mc-lang--row .mc-lang__trigger {
        order: 1;
      }
      .mc-lang__trigger {
        display: inline-flex;
        align-items: center;
        gap: var(--mc-space-1);
        height: 2rem;
        padding: 0 var(--mc-space-3);
        border: 0;
        border-radius: var(--mc-radius-pill);
        background: transparent;
        color: var(--mc-ink-muted);
        font: inherit;
        font-size: var(--mc-fs-caption);
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        transition: background var(--mc-dur-1) var(--mc-ease-standard),
          color var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-lang__trigger:hover,
      .mc-lang__trigger[aria-expanded='true'] {
        background: var(--mc-accent-soft);
        color: var(--mc-ink);
      }
      .mc-lang__chevron {
        font-size: 0.75rem;
        line-height: 1;
        transition: transform var(--mc-dur-1) var(--mc-ease-standard);
      }
      .mc-lang__trigger[aria-expanded='true'] .mc-lang__chevron {
        transform: rotate(180deg);
      }
      .mc-lang__menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        z-index: 40;
        inline-size: 12.5rem;
        margin: 0;
        padding: var(--mc-space-2) 0;
        list-style: none;
        background: var(--mc-bg-raised);
        border: 1px solid var(--mc-line-strong);
        border-radius: var(--mc-radius-md);
        box-shadow: var(--mc-elev-2);
        animation: mc-lang-enter var(--mc-dur-2) var(--mc-ease-enter);
      }
      .mc-lang__menu--above {
        top: auto;
        bottom: calc(100% + 0.5rem);
        right: auto;
        left: 0;
      }
      @keyframes mc-lang-enter {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .mc-lang__menu {
          animation: none;
        }
        .mc-lang__chevron {
          transition: none;
        }
      }
      .mc-lang__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        inline-size: 100%;
        height: 2.5rem;
        padding: 0 var(--mc-space-3) 0 var(--mc-space-4);
        border: 0;
        background: transparent;
        color: var(--mc-ink);
        font: inherit;
        font-size: var(--mc-fs-body-md);
        text-align: start;
        cursor: pointer;
      }
      .mc-lang__item:hover,
      .mc-lang__item:focus-visible {
        background: var(--mc-accent-soft);
      }
      .mc-lang__item--active {
        font-weight: 500;
      }
      .mc-lang__check {
        color: var(--mc-accent);
      }
    `
  ]
})
export class LanguageSelectorComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly locales = SUPPORTED_LOCALES;

  readonly layout = input<LayoutMode>('pill');

  protected readonly open = signal(false);
  protected readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly menuEl = viewChild<ElementRef<HTMLUListElement>>('menu');

  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly isRow = (): boolean => this.layout() === 'row';

  protected currentCode(): string {
    return this.i18n.locale().toUpperCase();
  }

  protected currentAria(): string {
    const key: I18nKey =
      this.i18n.locale() === 'pt' ? 'common.locale.current.pt' : 'common.locale.current.en';
    return this.i18n.t(key);
  }

  protected optionKey(locale: SupportedLocale): I18nKey {
    return locale === 'pt' ? 'common.locale.option.pt' : 'common.locale.option.en';
  }

  protected togglePopover(): void {
    this.open.update((v) => !v);
  }

  protected onTriggerKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.open.set(true);
      queueMicrotask(() => this.focusFirstItem());
    } else if (event.key === 'Escape') {
      this.closeAndFocusTrigger();
    }
  }

  protected onMenuKey(event: KeyboardEvent): void {
    const items = this.menuItems();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeAndFocusTrigger();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const idx = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = items[(idx + 1) % items.length];
      next?.focus();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const idx = items.indexOf(document.activeElement as HTMLButtonElement);
      const prev = items[(idx - 1 + items.length) % items.length];
      prev?.focus();
      return;
    }
    if (/^[a-zA-Z]$/.test(event.key)) {
      const letter = event.key.toLowerCase();
      const match = items.find((btn) =>
        (btn.textContent ?? '').trim().toLowerCase().startsWith(letter)
      );
      match?.focus();
    }
  }

  protected pick(locale: SupportedLocale): void {
    this.i18n.setLocale(locale);
    this.closeAndFocusTrigger();
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onGlobalEscape(): void {
    if (this.open()) this.closeAndFocusTrigger();
  }

  private menuItems(): HTMLButtonElement[] {
    const el = this.menuEl()?.nativeElement;
    return el ? Array.from(el.querySelectorAll<HTMLButtonElement>('.mc-lang__item')) : [];
  }

  private focusFirstItem(): void {
    const items = this.menuItems();
    const active = items.find((btn) => btn.classList.contains('mc-lang__item--active'));
    (active ?? items[0])?.focus();
  }

  private closeAndFocusTrigger(): void {
    this.open.set(false);
    queueMicrotask(() => this.trigger()?.nativeElement.focus());
  }
}
