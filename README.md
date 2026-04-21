# MasterClass AI English — Web monorepo

**Status: v1.0 — initial public drop.** Angular 17 monorepo for the MasterClass
AI English tutoring platform. This repo owns the Angular frontend (`apps/web`)
plus shared + feature libraries. The .NET Clean Architecture backend (Azure
OpenAI orchestration, ElevenLabs TTS, Groq STT) will land in a sibling repo;
frontend speaks to it via injected client tokens (`AZURE_OPENAI_JUDGE`,
`ELEVENLABS_TTS`, `GROQ_STT`) so no credentials are held in this repo.

## Layout

```
apps/
  web/                       Standalone-components Angular app (the shell)

libs/
  shared/
    ui/                      Cross-feature presentational components
    tokens/                  Design tokens (populated by SEV-7 / A2)
    i18n/                    Locale metadata + translation catalog contract
    a11y/                    Accessibility primitives (live announcer, etc.)
  feature/
    auth/                    Sign in, account recovery
    onboarding/              Welcome flow + CEFR placement
    classroom/               Voice + text AI tutor
    materials/               Lessons, vocab, exercises, summaries
    review/                  Spaced-repetition review
    progress/                CEFR progress + evolution history
    profile/                 Account, preferences, language selector

.github/workflows/ci.yml     Lint / test / build on push + PR
angular.json                 Single `web` application project
tsconfig.json                Path aliases for `@shared/*` and `@feature/*`
```

Each feature lib exports a `*_ROUTES` constant. The app shell lazy-loads them
through `loadChildren`, so adding a new feature is scoped to its own lib.

## Commands

All commands run from the repo root.

```
npm ci             # clean install (CI + fresh clones)
npm start          # dev server at http://localhost:4200
npm run build      # production build into dist/apps/web
npm test           # headless Karma/Jasmine test run
npm run lint       # ESLint (TS + Angular templates)
```

## Supported locales

Registered in `apps/web/src/app/app.config.ts`:

- `en` (English)
- `pt-BR` (Brazilian Portuguese)

Translation catalogs and the language selector land in
[SEV-8](/SEV/issues/SEV-8). This ticket only registers the locales and picks an
initial `LOCALE_ID` from the browser.

## Design system

Tokens and Instrument Serif display typography are tracked in
[SEV-7](/SEV/issues/SEV-7). The `libs/shared/tokens` entry point is a placeholder
so features can depend on `@shared/tokens` without churn once real tokens land.

## Node version

- Node 20 (see `.nvmrc`)
- npm 10+

## Backend (sibling repo, Clean Architecture)

The .NET backend is not part of this repo. Once the sibling repo is published
it will expose the Azure OpenAI / ElevenLabs / Groq integrations behind the
client tokens above. Typical local run:

```
dotnet restore
dotnet run --project src/MasterClass.Api
```

Credentials (`AZURE_OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `GROQ_API_KEY`) must
come from environment variables or a user-secrets store — never commit them.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `lint`, `test`, and `build` on
every push and PR to `main`. The build must stay green before merge.

## Parent issues

- Parent epic: [SEV-4](/SEV/issues/SEV-4) — v1.0 Claude Design rollout
- This scaffold: [SEV-6](/SEV/issues/SEV-6) — A1 Angular monorepo + app shell
