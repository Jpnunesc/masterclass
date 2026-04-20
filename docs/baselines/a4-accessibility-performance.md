# A4 — Accessibility + Performance baselines

_Locked-in baselines for the empty Angular shell (SEV-9)._ Later B-child screens
must not bust these without a deliberate budget update.

## Hard CI gates

- `npm run lint` — zero errors.
- `npm test` — unit suite includes:
  - `apps/web/src/app/app.axe.spec.ts` — axe-core against the rendered app shell
    (EN + PT) and the Home screen. Rules: `wcag2a`, `wcag2aa`, `wcag21a`,
    `wcag21aa`. Any violation fails CI.
  - `apps/web/src/app/app.keyboard.spec.ts` — keyboard-only smoke: skip link is
    first tab stop, primary nav links are reachable, `#mc-main` is a programmatic
    focus target, no positive `tabindex` values.
  - Per-route axe specs extend the gate to every implemented screen (SEV-31 C2):
    Auth, Onboarding steps, Assessment, Classroom shell + states gallery,
    Lesson preview, Materials Library, Review, Progress, Lesson History,
    Profile. Any `wcag2aa` violation fails CI.
  - `libs/feature/classroom/src/lib/classroom.keyboard.spec.ts` — Classroom
    keyboard smoke (Tab order covers mic + gallery link, `M` toggles mic,
    `Escape` cancels an armed mic without trapping focus, no positive
    `tabindex`).
  - `libs/feature/classroom/src/lib/reduced-motion.spec.ts` — SEV-31 regression
    guard that avatar halo/mouth/thinking-dots/idle-breathe and mic halo/amp
    animations are silenced under `prefers-reduced-motion: reduce`.
  - `libs/shared/a11y/**/*.spec.ts` — live-announcer + reduced-motion unit specs.
- `npm run check:no-hex` — no raw hex in feature libs (SEV-7).
- `npm run check:i18n` — EN/PT parity + no hard-coded strings (SEV-8).
- `npm run lhci` — Lighthouse CI runs against the production build
  (`dist/apps/web/browser`) with the budgets below.

## Lighthouse budgets (`lighthouserc.json`)

| Metric                     | Budget                  | Applies to                   |
| -------------------------- | ----------------------- | ---------------------------- |
| `categories:accessibility` | ≥ 1.00 (error)          | every route                  |
| `categories:best-practices`| ≥ 0.90 (error)          | every route                  |
| `categories:performance`   | ≥ 0.90 (error)          | every route                  |
| `cumulative-layout-shift`  | ≤ 0.10 (error)          | every route                  |
| `largest-contentful-paint` | ≤ 2500 ms (error)       | every route                  |
| `total-blocking-time`      | ≤ 300 ms (error)        | every route                  |
| `total-byte-weight`        | ≤ 400 000 B (error)     | every route                  |
| `largest-contentful-paint` | ≤ 2000 ms (error)       | shell route `/index.html`    |
| `total-blocking-time`      | ≤ 200 ms (error)        | shell route `/index.html`    |

Routes audited on every run (SEV-31 C2 — every implemented screen):
`/index.html`, `/auth`, `/onboarding`, `/assessment`, `/classroom`, `/lesson`,
`/materials`, `/review`, `/progress`, `/history`, `/profile`,
`/sandbox/tokens`. Per-run runs: 3 (median is the decision value). Desktop
preset; headless Chrome with `--no-sandbox`.

## Build-output baseline (measured at scaffold commit)

Production build produces the following initial artifacts (raw / estimated gzip):

| Artifact                    | Raw      | Transfer (≈ gzip) |
| --------------------------- | -------- | ----------------- |
| `main.js`                   |  9.18 kB |  3.04 kB          |
| `polyfills.js`              | 34.98 kB | 11.46 kB          |
| `styles.css`                |  9.28 kB |  2.06 kB          |
| Vendor chunks (Angular/router/i18n) | 199.39 kB | 57.34 kB |
| **Initial total**           | **254.77 kB** | **73.90 kB** |

Angular production `initial` budget (from `angular.json`): 500 kB warning /
1 MB error. We are well inside; feature work should preserve that headroom.

## a11y primitives shipped with the shell

- `@shared/a11y` — runtime
  - `LIVE_ANNOUNCER` token + `DomLiveAnnouncer` service with polite/assertive
    aria-live regions. Provided app-wide via `provideLiveAnnouncer()`.
  - `ReducedMotionService` — signal that reflects
    `matchMedia('(prefers-reduced-motion: reduce)')`.
  - `focus-visible.scss` — `@include focus-ring(...)`,
    `@include motion-safe-transition(...)` and a `.mc-visually-hidden` utility
    for feature-lib composition.
- `@shared/a11y/testing` — test-only entrypoint (excluded from the app bundle)
  - `runAxe` / `expectNoAxeViolations` helpers.
  - `getKeyboardFocusOrder` helper for keyboard smoke tests.

## Regeneration

Baselines are re-measured whenever the shell changes materially. To refresh:

```bash
npm ci
npm run build
npm run lhci            # produces ./lhci-results/*.html
```

Lighthouse HTML reports from the empty shell are uploaded as the `lhci-results`
artifact on every CI run (see `.github/workflows/ci.yml`).
