# MasterClass API (`apps/api/`)

.NET 8 Clean Architecture backend for MasterClass. Phases 1 & 2 landed — structure, Postgres schema, JWT auth skeleton, and AI vendor integration (Azure OpenAI + ElevenLabs + Groq) with a WebSocket classroom hub.

## Stack

- ASP.NET Core 8 (Minimal APIs)
- Entity Framework Core 8 + `Npgsql.EntityFrameworkCore.PostgreSQL`
- `Microsoft.AspNetCore.Identity` `PasswordHasher<T>` (PBKDF2-HMAC-SHA256, V3 format)
- JWT bearer auth (`System.IdentityModel.Tokens.Jwt`)
- xUnit + `Microsoft.AspNetCore.Mvc.Testing` (+ SQLite in-memory for integration tests)

## Layout

```
apps/api/
├── MasterClass.sln
├── src/
│   ├── MasterClass.Domain/         # Entities, value objects, enums — no dependencies
│   ├── MasterClass.Application/    # Use cases, DTOs, abstractions (IMasterClassDbContext, IPasswordHasher, ITokenIssuer)
│   ├── MasterClass.Infrastructure/ # EF Core DbContext + configs, JWT/PBKDF2 impls, migrations
│   └── MasterClass.Api/            # Host, endpoints, Swagger, middleware
└── tests/
    ├── MasterClass.Domain.Tests/
    ├── MasterClass.Application.Tests/
    └── MasterClass.Api.Tests/
```

## Configuration

All secrets and deployment-specific values come from environment variables — never committed. `appsettings.json` has safe defaults only; `appsettings.Development.json` is git-ignored.

| Variable | Required | Purpose |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | yes | Postgres connection string (e.g. `Host=localhost;Port=5432;Database=masterclass;Username=postgres;Password=...`) |
| `Jwt__SecretKey` | yes | HMAC-SHA256 signing key, ≥ 32 chars |
| `Jwt__Issuer` | no | Defaults to `MasterClass.API` |
| `Jwt__Audience` | no | Defaults to `MasterClass.Web` |
| `Jwt__AccessTokenExpirationMinutes` | no | Defaults to `15` |
| `Jwt__RefreshTokenExpirationDays` | no | Defaults to `7` (refresh endpoint pending) |
| `AI__Endpoint` | for AI features | e.g. `https://my-resource.openai.azure.com` |
| `AI__ApiKey` | for AI features | Azure OpenAI resource key |
| `AI__ModelRouting__Conversation` | for AI features | Chat deployment used for live lesson turns |
| `AI__ModelRouting__Assessment` | for AI features | Chat deployment used for CEFR assessment |
| `AI__ModelRouting__MaterialGeneration` | for AI features | Chat deployment used for materials generation |
| `AI__ModelRouting__Analysis` | no | Optional; falls back to Conversation deployment if unset |
| `AI__ApiVersion` | no | Defaults to `2024-06-01` |
| `AI__Temperature` | no | Defaults to `0.3` |
| `AI__MaxOutputTokens` | no | Defaults to `800` |
| `Voice__ElevenLabs__ApiKey` | for TTS | ElevenLabs API key |
| `Voice__ElevenLabs__ModelId` | no | Defaults to `eleven_multilingual_v2` |
| `Voice__ElevenLabs__VoiceIdFemale` | no | Default female voice id (per-request `voiceId` overrides) |
| `Voice__ElevenLabs__VoiceIdMale` | no | Default male voice id |
| `Voice__ElevenLabs__OutputFormat` | no | Defaults to `mp3_44100_128` |
| `Voice__Groq__ApiKey` | for STT | Groq API key |
| `Voice__Groq__Model` | no | Defaults to `whisper-large-v3-turbo` |

AI env vars are only required when the corresponding endpoint is invoked; the API boots without them. Missing config produces a `502 Bad Gateway` at call time with an explicit message, not a crash at startup.

## Run locally

```bash
# From apps/api/
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=masterclass;Username=postgres;Password=postgres"
export Jwt__SecretKey="change-me-to-something-long-and-random-32-plus-chars"

dotnet restore
dotnet run --project src/MasterClass.Api
```

Swagger UI is served at `http://localhost:5101/swagger` when `ASPNETCORE_ENVIRONMENT=Development`.

## Build & test

```bash
dotnet build
dotnet test
```

Tests use SQLite in-memory for API integration — no running Postgres required.

## Database migration

Requires a fresh Postgres and `dotnet-ef` CLI (`dotnet tool install --global dotnet-ef --version 8.0.10`).

```bash
# Apply initial schema
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=masterclass;Username=postgres;Password=postgres"
dotnet ef database update \
  --project src/MasterClass.Infrastructure \
  --startup-project src/MasterClass.Infrastructure
```

The initial migration creates the tables: `students`, `lessons`, `assessment_results`, `vocabulary_items`, `progress_snapshots`, `review_items`.

## Auth endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | anonymous | Register a new student (email + password ≥ 8 chars + display name). Returns JWT. |
| POST | `/auth/login` | anonymous | Exchange credentials for a JWT. |
| GET | `/auth/me` | Bearer JWT | Returns the current student's profile. |
| GET | `/health` | anonymous | Liveness probe. |

Request / response shapes match the `MasterClass.Application.Auth` records (`RegisterRequest`, `LoginRequest`, `AuthResponse`, `StudentProfile`).

## AI endpoints

Shapes live in `MasterClass.Application.Ai` (see `AiModels.cs`). Errors from upstream vendors surface as `502 Bad Gateway` with an `error`/`title` body.

| Method | Route | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/assessment/evaluate` | anonymous (v1) | `AssessmentRequest { conversation: ChatTurn[], targetLanguage? }` | `AssessmentEvaluation { level, rationale, strengths[], weaknesses[] }` |
| POST | `/api/lesson/turn` | anonymous (v1) | `LessonTurnRequest { studentLevel, topic, studentUtterance, history?, targetLanguage? }` | `LessonTurnResult { teacherResponse, corrections[] }` |
| POST | `/api/lesson/turn?stream=true` | anonymous (v1) | same | `text/event-stream` with `data: {"delta":"..."}` chunks terminated by `data: [DONE]` |
| POST | `/api/materials/generate` | anonymous (v1) | `MaterialsRequest { level, topic, vocabCount?, exerciseCount?, targetLanguage? }` | `GeneratedMaterials { lessonTitle, lessonSummary, vocabulary[], exercises[] }` |
| POST | `/api/tts/synthesize` | anonymous (v1) | `TtsRequest { text, voiceId }` | `audio/mpeg` binary stream |
| POST | `/api/stt/transcribe` | anonymous (v1) | `multipart/form-data` with `file` + optional `language` field | `TranscriptionResult { text, language }` |

> Auth on AI endpoints will tighten in Phase 3 once the Angular client wires its JWT; Phase 2 keeps them open for developer integration work.

## Classroom WebSocket (`/ws/classroom`)

Live teacher pipeline: client audio → Groq STT → Azure OpenAI lesson turn → ElevenLabs TTS → client audio + text. Closes the `session.locale` follow-up from v1.0 (§1.13).

**Connect** with a query string:

```
ws(s)://<host>/ws/classroom?level=B1&topic=travel&voiceId=<voice>&locale=en-US&audioFormat=webm
```

**Server → client (text JSON frames)**
- `{ "type": "session.open", "locale": "en-US", "level": "B1", "topic": "travel" }` — first frame on accept
- `{ "type": "session.locale", "locale": "en-US" }` — emitted on connect and whenever the locale changes
- `{ "type": "student.transcript", "text": "...", "language": "en" }`
- `{ "type": "teacher.turn", "text": "...", "corrections": [...] }`
- `{ "type": "teacher.audio.begin", "contentType": "audio/mpeg" }` → one or more **binary** frames → `{ "type": "teacher.audio.end" }`
- `{ "type": "error", "message": "..." }` on vendor or protocol errors
- `{ "type": "session.reset.ok" }` after a successful reset

**Client → server**
- `{ "type": "locale.set", "locale": "pt-BR" }` — change session locale
- `{ "type": "student.utterance.begin", "audioFormat": "webm" }` — start capturing an utterance (optional)
- **binary frames** — audio chunks (the server buffers them)
- `{ "type": "student.utterance.end" }` — triggers STT → Chat → TTS
- `{ "type": "student.text", "text": "..." }` — skip STT, run Chat + TTS directly
- `{ "type": "session.reset" }` — clear conversation history

## Phase roadmap

- **Phase 1** (SEV-42, done) — Structure, DB schema, auth skeleton.
- **Phase 2** (SEV-43, done) — AI vendor integration (Azure OpenAI / ElevenLabs / Groq) + WebSocket classroom.
- **Phase 3** (SEV-44) — Angular (`apps/web/`) cutover from mock services to real `/api` endpoints.
