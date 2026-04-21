import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';

import { I18nService, type I18nKey } from '@shared/i18n';
import { LanguageSelectorComponent } from '@shared/ui';
import { LIVE_ANNOUNCER } from '@shared/a11y';

import { LearnerSessionService } from './impersonate-learner.guard';

type AuthMode = 'login' | 'signup';

type FieldKey = 'email' | 'name' | 'password';

interface FieldErrors {
  email?: I18nKey;
  name?: I18nKey;
  password?: I18nKey;
}

const MIN_PASSWORD = 8;
const MIN_LOADING_MS = 300;
const TOAST_MS = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'mc-auth',
  standalone: true,
  imports: [FormsModule, LanguageSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mc-auth-shell">
      <span class="mc-auth-shell__mark" role="img" [attr.aria-label]="i18n.t('common.brand.name')">
        <span class="mc-auth-shell__glyph" aria-hidden="true">{{ mark }}</span>
      </span>

      <main class="mc-auth-shell__main">
        <section class="mc-auth-col" role="region" [attr.aria-labelledby]="titleId">
          <h1 class="mc-auth-col__title" [id]="titleId">
            {{ i18n.t(isSignup() ? 'auth.signup.title' : 'auth.login.title') }}
          </h1>
          <p class="mc-auth-col__sub">
            {{ i18n.t(isSignup() ? 'auth.signup.sub' : 'auth.login.sub') }}
          </p>

          <div
            class="mc-rail-tabs"
            role="tablist"
            [attr.aria-label]="i18n.t('auth.tab.aria')"
            (keydown)="onTabKey($event)"
          >
            <button
              #loginTab
              type="button"
              role="tab"
              class="mc-rail-tabs__tab"
              [class.mc-rail-tabs__tab--active]="!isSignup()"
              [attr.aria-selected]="!isSignup()"
              [attr.aria-controls]="formId"
              [attr.tabindex]="!isSignup() ? 0 : -1"
              (click)="setMode('login')"
            >
              {{ i18n.t('auth.tab.login') }}
            </button>
            <button
              #signupTab
              type="button"
              role="tab"
              class="mc-rail-tabs__tab"
              [class.mc-rail-tabs__tab--active]="isSignup()"
              [attr.aria-selected]="isSignup()"
              [attr.aria-controls]="formId"
              [attr.tabindex]="isSignup() ? 0 : -1"
              (click)="setMode('signup')"
            >
              {{ i18n.t('auth.tab.signup') }}
            </button>
          </div>

          <div
            class="mc-auth-form-panel"
            role="tabpanel"
            [id]="formId"
            [attr.aria-labelledby]="titleId"
            [attr.aria-busy]="loading()"
          >
          <form
            #form="ngForm"
            class="mc-auth-form"
            novalidate
            (ngSubmit)="onSubmit(form)"
          >
            @for (m of [mode()]; track m) {
              <div class="mc-auth-form__fields">
                <div class="mc-field">
                  <label [attr.for]="emailId" class="mc-field__label">
                    {{ i18n.t('auth.field.email.label') }}
                  </label>
                  <input
                    [id]="emailId"
                    name="email"
                    type="email"
                    autocomplete="email"
                    class="mc-field__input"
                    [class.mc-field__input--error]="!!errors().email"
                    [attr.aria-invalid]="!!errors().email"
                    [attr.aria-describedby]="errors().email ? emailErrorId : null"
                    [disabled]="loading()"
                    [ngModel]="email()"
                    (ngModelChange)="onFieldInput('email', $event)"
                    (blur)="onFieldBlur('email')"
                    inputmode="email"
                  />
                  @if (errors().email) {
                    <p class="mc-field__error" [id]="emailErrorId">
                      {{ i18n.t(errors().email!) }}
                    </p>
                  }
                </div>

                @if (isSignup()) {
                  <div class="mc-field">
                    <label [attr.for]="nameId" class="mc-field__label">
                      {{ i18n.t('auth.field.name.label') }}
                    </label>
                    <input
                      [id]="nameId"
                      name="name"
                      type="text"
                      autocomplete="name"
                      class="mc-field__input"
                      [class.mc-field__input--error]="!!errors().name"
                      [attr.aria-invalid]="!!errors().name"
                      [attr.aria-describedby]="errors().name ? nameErrorId : null"
                      [disabled]="loading()"
                      [ngModel]="name()"
                      (ngModelChange)="onFieldInput('name', $event)"
                      (blur)="onFieldBlur('name')"
                    />
                    @if (errors().name) {
                      <p class="mc-field__error" [id]="nameErrorId">
                        {{ i18n.t(errors().name!) }}
                      </p>
                    }
                  </div>
                }

                <div class="mc-field">
                  <label [attr.for]="passwordId" class="mc-field__label">
                    {{ i18n.t('auth.field.password.label') }}
                  </label>
                  <div class="mc-field__wrap">
                    <input
                      [id]="passwordId"
                      name="password"
                      [type]="showPassword() ? 'text' : 'password'"
                      [autocomplete]="isSignup() ? 'new-password' : 'current-password'"
                      class="mc-field__input mc-field__input--with-affix"
                      [class.mc-field__input--error]="!!errors().password"
                      [attr.aria-invalid]="!!errors().password"
                      [attr.aria-describedby]="passwordDescribedBy()"
                      [disabled]="loading()"
                      [ngModel]="password()"
                      (ngModelChange)="onFieldInput('password', $event)"
                      (blur)="onFieldBlur('password')"
                    />
                    <button
                      type="button"
                      class="mc-field__affix"
                      [attr.aria-label]="i18n.t(showPassword() ? 'auth.field.password.hide' : 'auth.field.password.show')"
                      [attr.aria-pressed]="showPassword()"
                      (click)="togglePassword()"
                    >
                      @if (showPassword()) {
                        <svg class="mc-field__affix-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                          <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.48 7.48L21 21m-3.642-3.642l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      } @else {
                        <svg class="mc-field__affix-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                          <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                      }
                    </button>
                  </div>
                  @if (isSignup() && !errors().password) {
                    <p class="mc-field__help" [id]="passwordHelpId">
                      {{ i18n.t('auth.signup.password.help') }}
                    </p>
                  }
                  @if (errors().password) {
                    <p class="mc-field__error" [id]="passwordErrorId">
                      {{ i18n.t(errors().password!) }}
                    </p>
                  }
                </div>
              </div>
            }

            <button
              type="submit"
              class="mc-btn mc-btn-primary mc-auth-form__cta"
              [disabled]="!canSubmit() || loading()"
            >
              @if (loading()) {
                <span class="mc-auth-form__spinner" aria-hidden="true"></span>
              } @else {
                {{ i18n.t(isSignup() ? 'auth.cta.signup' : 'auth.cta.login') }}
              }
            </button>

            <button
              type="button"
              class="mc-auth-form__switch"
              (click)="setMode(isSignup() ? 'login' : 'signup')"
            >
              {{ i18n.t(isSignup() ? 'auth.switch.to_login' : 'auth.switch.to_signup') }}
            </button>
          </form>
          </div>
        </section>
      </main>

      <footer class="mc-auth-shell__foot">
        <mc-language-selector layout="pill" class="mc-auth-shell__lang" />
        <p class="mc-auth-shell__legal">{{ i18n.t('auth.form.legal') }}</p>
      </footer>

      @if (toast()) {
        <div class="mc-toast" role="alert" aria-live="assertive">
          {{ i18n.t(toast()!) }}
        </div>
      }
    </div>
  `,
  styleUrls: ['./auth.layout.scss', './auth.form.scss'],
})
export class AuthComponent {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly session = inject(LearnerSessionService);
  private readonly announcer = inject(LIVE_ANNOUNCER, { optional: true });

  protected readonly mark = 'M';
  private readonly uid = Math.random().toString(36).slice(2, 8);
  protected readonly titleId = `mc-auth-title-${this.uid}`;
  protected readonly formId = `mc-auth-form-${this.uid}`;
  protected readonly emailId = `mc-auth-email-${this.uid}`;
  protected readonly nameId = `mc-auth-name-${this.uid}`;
  protected readonly passwordId = `mc-auth-password-${this.uid}`;
  protected readonly emailErrorId = `${this.emailId}-error`;
  protected readonly nameErrorId = `${this.nameId}-error`;
  protected readonly passwordErrorId = `${this.passwordId}-error`;
  protected readonly passwordHelpId = `${this.passwordId}-help`;

  protected readonly mode = signal<AuthMode>('login');
  protected readonly isSignup = computed(() => this.mode() === 'signup');

  protected readonly email = signal('');
  protected readonly name = signal('');
  protected readonly password = signal('');

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly toast = signal<I18nKey | null>(null);

  private readonly attempted = signal(false);
  private readonly touched = signal<Record<FieldKey, boolean>>({
    email: false,
    name: false,
    password: false
  });

  protected readonly errors = computed<FieldErrors>(() => {
    if (!this.attempted()) return {};
    const touched = this.touched();
    const out: FieldErrors = {};
    const email = this.email().trim();
    const password = this.password();
    if (touched.email) {
      if (!email) out.email = 'auth.error.emailRequired';
      else if (!EMAIL_RE.test(email)) out.email = 'auth.error.emailFormat';
    }
    if (this.isSignup() && touched.name) {
      if (!this.name().trim()) out.name = 'auth.error.nameRequired';
    }
    if (touched.password) {
      if (!password) out.password = 'auth.error.passwordRequired';
      else if (this.isSignup() && password.length < MIN_PASSWORD)
        out.password = 'auth.error.passwordShort';
    }
    return out;
  });

  protected readonly canSubmit = computed(() => {
    if (!this.email().trim()) return false;
    if (!this.password()) return false;
    if (this.isSignup() && !this.name().trim()) return false;
    return true;
  });

  protected readonly passwordDescribedBy = computed(() => {
    const parts: string[] = [];
    if (this.errors().password) parts.push(this.passwordErrorId);
    else if (this.isSignup()) parts.push(this.passwordHelpId);
    return parts.length ? parts.join(' ') : null;
  });

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly loginTab = viewChild<ElementRef<HTMLButtonElement>>('loginTab');
  private readonly signupTab = viewChild<ElementRef<HTMLButtonElement>>('signupTab');

  constructor() {
    effect(() => {
      const k = this.toast();
      if (!k) return;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.toast.set(null), TOAST_MS);
      this.announcer?.announce(this.i18n.t(k), 'assertive');
    });
  }

  protected setMode(mode: AuthMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.password.set('');
    this.touched.set({ email: this.touched().email, name: false, password: false });
    this.toast.set(null);
  }

  protected onTabKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: AuthMode = this.isSignup() ? 'login' : 'signup';
    this.setMode(next);
    queueMicrotask(() => {
      const target = next === 'login' ? this.loginTab() : this.signupTab();
      target?.nativeElement.focus();
    });
  }

  protected onFieldInput(field: FieldKey, value: string): void {
    if (field === 'email') this.email.set(value);
    else if (field === 'name') this.name.set(value);
    else this.password.set(value);
    if (this.attempted()) this.touched.update((t) => ({ ...t, [field]: true }));
  }

  protected onFieldBlur(field: FieldKey): void {
    if (!this.attempted()) return;
    this.touched.update((t) => ({ ...t, [field]: true }));
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected async onSubmit(form: NgForm): Promise<void> {
    this.attempted.set(true);
    this.touched.set({ email: true, name: true, password: true });
    const errs = this.errors();
    if (errs.email || errs.name || errs.password) {
      this.focusFirstError();
      return;
    }
    this.toast.set(null);
    this.loading.set(true);
    const started = Date.now();
    try {
      await this.submit();
      this.session.setIdentity({
        userId: this.email().trim(),
        displayName: this.isSignup() ? this.name().trim() : null,
        email: this.email().trim(),
        impersonated: false
      });
      await this.drain(started);
      const target = this.isSignup() ? '/onboarding' : '/classroom';
      await this.router.navigateByUrl(target);
      form.resetForm();
      this.email.set('');
      this.name.set('');
      this.password.set('');
      this.attempted.set(false);
    } catch (err) {
      await this.drain(started);
      this.toast.set(this.classifyError(err));
      this.focusFirstError();
    } finally {
      this.loading.set(false);
    }
  }

  private async drain(started: number): Promise<void> {
    const remaining = MIN_LOADING_MS - (Date.now() - started);
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  }

  private async submit(): Promise<void> {
    // v1.0 stub — no backend yet. Pretend a brief round-trip so the spinner is
    // visible and the success path exercises the loading contract.
    await new Promise((r) => setTimeout(r, 50));
  }

  private classifyError(err: unknown): I18nKey {
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'invalid-credentials') return 'auth.error.loginInvalid';
      if (code === 'email-conflict') return 'auth.error.signupConflict';
      if (code === 'network') return 'auth.error.network';
    }
    return 'auth.error.unknown';
  }

  private focusFirstError(): void {
    const errs = this.errors();
    const id = errs.email ? this.emailId : errs.name ? this.nameId : errs.password ? this.passwordId : this.emailId;
    queueMicrotask(() => (document.getElementById(id) as HTMLInputElement | null)?.focus());
  }
}
