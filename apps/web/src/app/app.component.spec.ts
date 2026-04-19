import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    document.documentElement.removeAttribute('lang');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('creates the root component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders brand mark in English by default', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('MasterClass');
    expect(el.textContent).toContain('AI English');
    expect(el.textContent).toContain('Classroom');
  });

  it('switches shell strings to pt live when locale changes', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Classroom');

    i18n.setLocale('pt');
    fixture.detectChanges();
    expect(el.textContent).toContain('Sala de aula');
    expect(el.textContent).not.toContain('Classroom');
  });
});
