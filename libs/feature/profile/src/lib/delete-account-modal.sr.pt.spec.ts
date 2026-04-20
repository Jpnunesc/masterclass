import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LearnerSessionService } from '@feature/auth';
import { I18nService } from '@shared/i18n';
import { provideLiveAnnouncer } from '@shared/a11y';
import {
  expectPhrasesInOrder,
  recordSrTranscript,
  walkWithScreenReader
} from '@shared/a11y/testing';

import { DeleteAccountModalComponent } from './delete-account-modal.component';

const TEST_EMAIL = 'aluno@exemplo.com.br';

function tick(ms = 30): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('SR-smoke — Profile delete-account PT-BR (SEV-38 §5.5)', () => {
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });
  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    await TestBed.configureTestingModule({
      imports: [DeleteAccountModalComponent],
      providers: [provideLiveAnnouncer(), provideRouter([])]
    }).compileComponents();

    const session = TestBed.inject(LearnerSessionService);
    session.setIdentity({
      userId: 'sr-smoke',
      displayName: 'Aluno de teste',
      email: TEST_EMAIL,
      impersonated: true
    });
  });

  afterEach(() => {
    document
      .querySelectorAll('mc-delete-account-modal')
      .forEach((n) => n.remove());
    document.getElementById('mc-live-announcer')?.remove();
  });

  it('narrates destructive confirmation fully in PT-BR', async () => {
    TestBed.inject(I18nService).setLocale('pt-BR');

    const fixture = TestBed.createComponent(DeleteAccountModalComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await tick();
    fixture.detectChanges();

    expect(document.documentElement.getAttribute('lang')).toBe('pt-BR');

    const root = fixture.nativeElement as HTMLElement;
    const dialog = root.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog!.getAttribute('aria-modal')).toBe('true');
    expect(dialog!.getAttribute('aria-labelledby')).toBe('mc-delete-modal-title');

    // Initial SR walk over the mounted modal — every surface string in PT.
    const initial = await walkWithScreenReader({ container: dialog! });
    expect(initial.lang).toBe('pt-BR');
    expectPhrasesInOrder(initial.spokenPhrases, [
      'Excluir sua conta?',
      'Isso removerá permanentemente suas aulas, progresso e preferências.',
      'Você sairá logo em seguida. Sempre pode criar conta novamente com o mesmo e-mail mais tarde.',
      'Digite seu e-mail para confirmar',
      `Deve corresponder exatamente a ${TEST_EMAIL}.`,
      'Cancelar',
      'Excluir minha conta'
    ]);

    // Initial focus landed on the typed-confirm input (per modal contract).
    const confirmInput = dialog!.querySelector<HTMLInputElement>(
      '#mc-delete-confirm'
    );
    expect(confirmInput).toBeTruthy();
    expect(document.activeElement).toBe(confirmInput);

    // Destructive button starts disabled; typing the email must enable it
    // (canDelete flips true) and the SR walk after typing must carry the
    // same PT destructive button label.
    const destructive = dialog!.querySelector<HTMLButtonElement>(
      '.mc-btn-destructive'
    );
    expect(destructive).toBeTruthy();
    expect(destructive!.getAttribute('aria-disabled')).toBe('true');

    confirmInput!.value = TEST_EMAIL;
    confirmInput!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await tick();
    fixture.detectChanges();
    expect(destructive!.getAttribute('aria-disabled')).toBe('false');

    const afterType = await walkWithScreenReader({ container: dialog! });
    expectPhrasesInOrder(afterType.spokenPhrases, [
      'Excluir sua conta?',
      'Digite seu e-mail para confirmar',
      'Cancelar',
      'Excluir minha conta'
    ]);

    recordSrTranscript(
      'delete-account',
      afterType,
      [
        'Excluir sua conta?',
        'Isso removerá permanentemente suas aulas, progresso e preferências.',
        'Você sairá logo em seguida. Sempre pode criar conta novamente com o mesmo e-mail mais tarde.',
        'Digite seu e-mail para confirmar',
        `Deve corresponder exatamente a ${TEST_EMAIL}.`,
        'Cancelar',
        'Excluir minha conta'
      ]
    );
  });
});
