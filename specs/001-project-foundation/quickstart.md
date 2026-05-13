# Quickstart: Project Foundation

This quickstart validates the Phase 1 local-only foundation. It assumes the
repository has been checked out on Windows, macOS, Linux, or WSL with a container
runtime available for local Supabase services.

## Prerequisites

- Node.js 20.9 or newer
- Python 3.12
- A Docker-compatible container runtime
- Package managers selected during implementation

## 1. Configure Local Environment

1. Copy `.env.example` to the local environment file used by the frontend and backend.
2. Fill only local development values.
3. Confirm no real secrets are committed.

Expected result: all required local settings are documented with safe example
values and secret placeholders.

## 2. Start Local Supabase Services

Run the project commands that initialize and start the local Supabase stack.

Expected result: local PostgreSQL, Auth, and Storage services are running and
reachable from the backend.

## 3. Start the Backend

Run the backend development command:

```powershell
cd backend
python -m uvicorn coinvault.main:app --app-dir src --reload
```

Expected result: the FastAPI app starts locally and exposes `/health`.

## 4. Start the Frontend

Run the frontend development command:

```powershell
cd frontend
npm run dev
```

Expected result: the Next.js app starts locally and exposes:
- English public placeholder screen
- English admin placeholder screen
- Arabic RTL public placeholder screen
- Arabic RTL admin placeholder screen
- Health/status screen

## 5. Verify Foundation Health

Open the health/status screen or call the backend health endpoint.

Expected result:
- Aggregate status is visible.
- Per-service statuses are visible for web, backend, database, auth, and storage.
- Failures identify the affected service without exposing secrets.

## 6. Validate Mobile and RTL Behavior

Check the public/admin placeholder screens at a 360px-wide viewport in English
and Arabic.

Expected result:
- No horizontal scrolling.
- No clipped controls.
- No overlapping text.
- Arabic renders right-to-left.

## 7. Run Manual-Release Validation

Run the release validation command:

```powershell
.\scripts\validate-release.ps1
```

Expected result: validation reports code quality, tests, build readiness, and
documentation status for the manual release candidate.

## Deferred Beyond Phase 1

Phase 1 does not create preview or production deployment setup. Deployment
planning remains documented but unimplemented until a later phase.
