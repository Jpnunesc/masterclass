import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  color,
  elevation,
  fontSize,
  radius,
  space
} from '@shared/tokens';

type ColorRow = { token: string; value: string; name: string };

@Component({
  selector: 'mc-tokens-reference',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mc-container mc-stack tokens-root">
      <header class="mc-stack">
        <p class="mc-caption">Claude Design · v1.0</p>
        <h1 class="mc-display-lg">Design tokens</h1>
        <p class="mc-body-lg lead">
          Reference sheet for the token pipeline that powers every screen.
          Toggle theme and density in the header to preview variants.
        </p>
      </header>

      <div class="section">
        <h2 class="mc-heading-lg">Type scale</h2>
        <div class="type-grid">
          <div><span class="mc-display-xl">Aa</span><code>--mc-type-display-xl</code></div>
          <div><span class="mc-display-lg">Aa</span><code>--mc-type-display-lg</code></div>
          <div><span class="mc-display-md">Aa</span><code>--mc-type-display-md</code></div>
          <div><span class="mc-display-sm">Aa</span><code>--mc-type-display-sm</code></div>
          <div><span class="mc-title">Title — card / modal title</span><code>--mc-type-title</code></div>
          <div><span class="mc-heading-lg">Headline large</span><code>--mc-fs-heading-lg</code></div>
          <div><span class="mc-heading-md">Headline medium</span><code>--mc-fs-heading-md</code></div>
          <div><span class="mc-body-lg">Body large — the quick brown fox.</span><code>--mc-fs-body-lg</code></div>
          <div><span class="mc-body-md">Body medium — the quick brown fox.</span><code>--mc-fs-body-md</code></div>
          <div><span class="mc-body-sm">Body small — the quick brown fox.</span><code>--mc-fs-body-sm</code></div>
        </div>
      </div>

      <div class="section">
        <h2 class="mc-heading-lg">Color palette</h2>
        @for (ramp of ramps; track ramp.name) {
          <div class="ramp">
            <h3 class="mc-heading-sm">{{ ramp.name }}</h3>
            <div class="swatches">
              @for (s of ramp.rows; track s.token) {
                <div class="swatch">
                  <span class="chip" [style.background]="s.value"></span>
                  <code>{{ s.token }}</code>
                  <span class="mc-caption">{{ s.value }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <div class="section">
        <h2 class="mc-heading-lg">Semantic surfaces</h2>
        <div class="surfaces">
          @for (s of surfaces; track s.token) {
            <div class="surface" [style.background]="'var(' + s.token + ')'">
              <code>{{ s.token }}</code>
            </div>
          }
        </div>
      </div>

      <div class="section">
        <h2 class="mc-heading-lg">Spacing</h2>
        <div class="stack-spacing">
          @for (s of spaceRows; track s.token) {
            <div class="space-row">
              <span class="space-bar" [style.width]="s.value"></span>
              <code>{{ s.token }}</code>
              <span class="mc-caption">{{ s.value }}</span>
            </div>
          }
        </div>
      </div>

      <div class="section">
        <h2 class="mc-heading-lg">Radius</h2>
        <div class="radius-grid">
          @for (r of radiusRows; track r.token) {
            <div class="radius-chip" [style.borderRadius]="r.value">
              <code>{{ r.token }}</code>
            </div>
          }
        </div>
      </div>

      <div class="section">
        <h2 class="mc-heading-lg">Elevation</h2>
        <div class="elevation-grid">
          @for (e of elevationRows; track e.token) {
            <div class="elevation-card" [style.boxShadow]="e.value">
              <code>{{ e.token }}</code>
            </div>
          }
        </div>
      </div>

      <div class="section">
        <h2 class="mc-heading-lg">Buttons</h2>
        <div class="mc-cluster">
          <button type="button" class="mc-btn mc-btn-primary">Primary</button>
          <button type="button" class="mc-btn mc-btn-secondary">Secondary</button>
          <button type="button" class="mc-btn mc-btn-ghost">Ghost</button>
          <span class="mc-badge">Badge</span>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./tokens-reference.component.scss']
})
export class TokensReferenceComponent {
  protected readonly ramps = buildRamps();
  protected readonly surfaces = [
    { token: '--mc-surface-canvas' },
    { token: '--mc-surface-raised' },
    { token: '--mc-surface-muted' },
    { token: '--mc-surface-inverse' }
  ];
  protected readonly spaceRows = Object.entries(space).map(([k, v]) => ({
    token: `--mc-space-${k}`,
    value: v
  }));
  protected readonly radiusRows = Object.entries(radius).map(([k, v]) => ({
    token: `--mc-radius-${k}`,
    value: v
  }));
  protected readonly elevationRows = Object.entries(elevation)
    .filter(([k]) => k !== '0')
    .map(([k, v]) => ({ token: `--mc-elevation-${k}`, value: v }));
  protected readonly fontSizes = Object.entries(fontSize);
}

function buildRamps(): { name: string; rows: ColorRow[] }[] {
  const ramp = (name: string, group: Record<string, string>, prefix: string) => ({
    name,
    rows: Object.entries(group).map(([k, v]) => ({
      token: `--mc-color-${prefix}-${k}`,
      value: v,
      name: k
    }))
  });
  return [
    ramp('Paper', color.paper, 'paper'),
    ramp('Ink', color.ink, 'ink'),
    ramp('Clay (accent)', color.clay, 'clay'),
    ramp('Moss', color.moss, 'moss')
  ];
}
