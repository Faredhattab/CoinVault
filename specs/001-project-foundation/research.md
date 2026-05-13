# Research: Project Foundation

## Decision: Next.js App Router for Placeholder Frontend

**Decision**: Initialize the frontend as a TypeScript Next.js App Router app
with Tailwind CSS and locale-aware routes for English and Arabic.

**Rationale**: The constitution requires Next.js, mobile-first UI, and
English/Arabic support from the start. Current official Next.js installation
guidance defaults to TypeScript, Tailwind, ESLint, App Router, and Turbopack
when using the latest app generator, and requires Node.js 20.9+.

**Alternatives considered**:
- Pages Router: valid, but less aligned with current Next.js defaults for new apps.
- Static HTML placeholders: simpler, but would not validate the actual frontend foundation.

**References**:
- Next.js App Router installation: https://nextjs.org/docs/app/getting-started/installation

## Decision: FastAPI Backend with Typed Health Contract

**Decision**: Initialize the backend as a FastAPI app with typed Pydantic response
models for aggregate and per-service health status.

**Rationale**: The constitution requires FastAPI for backend work, typed
contracts, dependency injection, and OpenAPI metadata. FastAPI publishes OpenAPI
metadata automatically from route and model declarations, making the health
contract suitable for both implementation and tests.

**Alternatives considered**:
- Plain Python HTTP server: too weak for the long-term backend architecture.
- Backend-less frontend health page: would not validate FastAPI or service probes.

**References**:
- FastAPI package metadata and Python requirement: https://pypi.org/project/fastapi/
- FastAPI version guidance: https://fastapi.tiangolo.com/deployment/versions/

## Decision: Local Supabase Stack for PostgreSQL, Auth, and Storage

**Decision**: Use the Supabase CLI local development stack for PostgreSQL, Auth,
and Storage in Phase 1.

**Rationale**: The clarified spec requires live local database/auth/storage
services, while deferring cloud deployment. Supabase official docs describe local
development using `supabase init` and `supabase start`, with a container runtime
required and local Studio available by default.

**Alternatives considered**:
- Configuration templates only: rejected by clarification; services must run.
- Hosted Supabase project: rejected by clarification; Phase 1 is local-only.
- Standalone PostgreSQL plus mocked auth/storage: less aligned with the planned
  Supabase service architecture.

**References**:
- Supabase local development docs: https://supabase.com/docs/guides/local-development
- Supabase CLI getting started: https://supabase.com/docs/guides/local-development/cli/getting-started

## Decision: Manual-Release Validation Workflow

**Decision**: Provide validation commands and a manual-release validation script
that checks formatting/linting, type checks, unit/integration tests, UI
responsive/i18n tests, and documentation presence.

**Rationale**: The spec clarifies that validation is required before manual
releases, not on every pull request. This satisfies the constitution's testing
and documentation requirements while matching the user's desired workflow.

**Alternatives considered**:
- Pull-request validation: stronger automation, but explicitly not selected.
- Local commands only: weaker release readiness signal.

## Decision: Health Status Shape

**Decision**: Expose one aggregate health result plus individual statuses for
web, backend, database, auth, and storage.

**Rationale**: The clarified spec requires aggregate plus per-service status.
This makes setup verification fast while keeping failures actionable.

**Alternatives considered**:
- Single pass/fail only: too opaque for local troubleshooting.
- Documentation-only troubleshooting: insufficient for a runnable foundation.
