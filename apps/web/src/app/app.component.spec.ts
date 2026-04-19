import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '@shared/i18n';
import { AppComponent } from './app.component';
import { BreakpointService } from './ui/shell';

class StubBreakpointService {
  readonly atLeastLg = () => true;
}

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem('mc.locale');
    document.documentElement.removeAttribute('lang');
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: BreakpointService, useClass: StubBreakpointService }
      ]
    }).compileComponents();
  });

  it('creates the root component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders brand wordmark + EN nav tabs by default', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('MasterClass');
    expect(el.textContent).toContain('Classroom');
    expect(el.textContent).toContain('Materials');
    expect(el.textContent).toContain('Progress');
    expect(el.textContent).toContain('Skip to content');
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

  it('hides the footer on /classroom and shows it elsewhere', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mc-app-footer')).toBeTruthy();
  });
});
