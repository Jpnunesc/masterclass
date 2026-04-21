# MasterClass API (`apps/api/`)

.NET 8 Clean Architecture backend for MasterClass. Phase 1 scaffold — structure, Postgres schema, and JWT auth skeleton. No AI vendor integration yet (that lands in Phase 2, tracked under SEV-41).

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
| `ConnectionStrings__Default` | yes | Postgres connection string (e.g. `Host=localhost;Port=5432;Database=masterclass;Username=postgres;Password=...`) |
| `Jwt__Secret` | yes | HMAC-SHA256 signing key, ≥ 32 chars |
| `Jwt__Issuer` | no | Defaults to `masterclass-api` |
| `Jwt__Audience` | no | Defaults to `masterclass-web` |
| `Jwt__AccessTokenLifetimeMinutes` | no | Defaults to `60` |
| `AzureOpenAI__Endpoint` | Phase 2 | Reserved for SEV-41 |
| `AzureOpenAI__ApiKey` | Phase 2 | Reserved for SEV-41 |
| `ElevenLabs__ApiKey` | Phase 2 | Reserved for SEV-41 |
| `Groq__ApiKey` | Phase 2 | Reserved for SEV-41 |

## Run locally

```bash
# From apps/api/
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=masterclass;Username=postgres;Password=postgres"
export Jwt__Secret="change-me-to-something-long-and-random-32-plus-chars"

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
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=masterclass;Username=postgres;Password=postgres"
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

## Phase roadmap

- **Phase 1** (this) — Structure, DB schema, auth skeleton. *Done when `dotnet test` is green and the migration applies to a fresh Postgres.*
- **Phase 2** (SEV-41) — AI vendor integration (Azure OpenAI / ElevenLabs / Groq) + WebSocket classroom.
- **Phase 3** — Angular (`apps/web/`) cutover from mock services to real `/api` endpoints.
