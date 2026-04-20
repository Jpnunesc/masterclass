import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, runAxe } from '@shared/a11y/testing';

/**
 * SEV-36: render the high-risk token surfaces (.mc-caption + .mc-btn-primary)
 * inside a real DOM and let axe-core evaluate computed contrast against the
 * globally-loaded utilities.scss. Catches regressions where a future ramp
 * change drops a state below 4.5:1, even if the unit math in contrast.spec
 * still passes for the literal hexes.
 */
@Component({
  standalone: true,
  selector: 'mc-tokens-fixture',
  template: `
    <main>
      <p class="mc-caption">small uppercase eyebrow text</p>
      <button type="button" class="mc-btn mc-btn-primary">Primary action</button>
    </main>
  `
})
class TokensFixtureComponent {}

describe('axe — SEV-36 token surfaces', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokensFixtureComponent]
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('mc-tokens-fixture').forEach((n) => n.remove());
  });

  it('.mc-caption + .mc-btn-primary pass color-contrast in default state', async () => {
    const fixture = TestBed.createComponent(TokensFixtureComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();

    const results = await runAxe(fixture.nativeElement);
    expectNoAxeViolations(results);
  });
});
