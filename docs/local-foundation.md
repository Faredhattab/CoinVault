# Local Foundation

Phase 1 establishes a local-only CoinVault foundation. Preview and production
deployment setup is deferred beyond this phase.

## Prerequisites

- Node.js 20.9 or newer
- Python 3.12
- A Docker-compatible container runtime
- Supabase CLI available through `npx supabase`

## Environment

Copy `.env.example` to your local environment file and fill local values only.
Never commit real secrets.

Required local values:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_STORAGE_URL`

Preview and production values are named for future planning, but their setup is
deferred. Phase 1 should not require hosted service credentials.

## Start Local Services

```powershell
npx supabase start
```

Expected local services:

- PostgreSQL database on `127.0.0.1:54322`
- Supabase API/Auth on `127.0.0.1:54321`
- Supabase Studio on `127.0.0.1:54323`
- Storage through the local Supabase API

## Start Backend

```powershell
cd backend
python -m uvicorn coinvault.main:app --app-dir src --reload
```

Health endpoint:

```text
http://127.0.0.1:8000/health
```

## Start Frontend

```powershell
cd frontend
npm run dev
```

Screens:

- `http://127.0.0.1:3000/en`
- `http://127.0.0.1:3000/en/admin`
- `http://127.0.0.1:3000/en/health`
- `http://127.0.0.1:3000/ar`
- `http://127.0.0.1:3000/ar/admin`
- `http://127.0.0.1:3000/ar/health`

## Health Verification

The foundation health surface shows one aggregate status and per-service statuses
for web, backend, database, auth, and storage. Messages must be user-safe and
must not expose secrets.

## Manual-Release Validation

Run validation before manual releases:

```powershell
.\scripts\validate-release.ps1
```

The script checks documentation, contracts, backend syntax, frontend package
metadata, and secret hygiene. If dependency folders are installed, project test
commands can be run separately before release.
