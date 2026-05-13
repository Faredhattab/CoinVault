# Implementation Plan: Project Foundation

**Branch**: `001-project-foundation` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-project-foundation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Establish the local-only foundation for CoinVault: a Next.js frontend with
minimal public/admin placeholder screens, a FastAPI backend exposing aggregate
and per-service health status, local Supabase services for PostgreSQL/Auth/Storage,
safe local environment configuration, and manual-release validation. Preview and
production deployment setup are explicitly deferred beyond Phase 1.

## Technical Context

**Language/Version**: TypeScript 5.x frontend on Node.js 20.9+; Python 3.12 backend  
**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, FastAPI, Pydantic, Uvicorn, Supabase CLI  
**Storage**: Local Supabase stack providing PostgreSQL, Auth, and Storage  
**Testing**: Frontend unit/component tests, backend unit tests, backend integration health tests, UI responsive/i18n tests covering English and Arabic RTL placeholder screens  
**Target Platform**: Local development only for Phase 1; preview and production deployment setup deferred  
**Project Type**: Full-stack web app with Next.js frontend and FastAPI backend  
**Performance Goals**: Local setup completes in under 30 minutes; health verification completes in under 5 minutes; placeholder screens render without visible layout shift on target breakpoints  
**Constraints**: Mobile-first responsive UX, English default locale, Arabic RTL support, no committed secrets, local database/auth/storage services must run, manual-release validation only  
**Scale/Scope**: Foundation only: local app shell, backend health surface, local service wiring, config templates, validation commands, and documentation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Clean Code**: PASS. Foundation is split into `frontend/`, `backend/`, and `supabase/` concerns with typed contracts and small health/config modules.
- **Function Tests**: PASS. Plan requires tests for health aggregation, service probes, config validation, and placeholder/i18n UI behavior.
- **Minimal Modern UX**: PASS. Phase 1 UI is limited to public/admin placeholders and a health/status surface.
- **Mobile-First Responsive**: PASS. Placeholder screens and health UI must validate at 360px first, then wider breakpoints.
- **Multilingual and RTL**: PASS. English and Arabic locale resources are required from Phase 1 for all user-facing base text.
- **Next.js Frontend Standard**: PASS. Frontend uses Next.js App Router with TypeScript and Tailwind CSS.
- **FastAPI Backend Standard**: PASS. Backend uses FastAPI with typed response models, dependency-injected service checks, and OpenAPI metadata.
- **Cloud-Native Operation**: PASS with scoped exception. Local-only Phase 1 intentionally defers preview/production deployment, but keeps environment-based config, health checks, local managed-service parity, and no-secret practices.
- **Living Documentation**: PASS. Plan creates `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`; AGENTS.md points to this plan.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-foundation/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- health.openapi.yaml
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
backend/
|-- src/
|   |-- coinvault/
|   |   |-- api/
|   |   |   `-- health.py
|   |   |-- core/
|   |   |   `-- config.py
|   |   |-- services/
|   |   |   |-- auth_health.py
|   |   |   |-- database_health.py
|   |   |   `-- storage_health.py
|   |   `-- main.py
|   `-- tests/
|       |-- integration/
|       `-- unit/
|-- pyproject.toml
`-- README.md

frontend/
|-- app/
|   |-- [locale]/
|   |   |-- admin/
|   |   |   `-- page.tsx
|   |   |-- health/
|   |   |   `-- page.tsx
|   |   |-- layout.tsx
|   |   `-- page.tsx
|-- src/
|   |-- components/
|   |-- i18n/
|   |   |-- ar.json
|   |   `-- en.json
|   `-- lib/
|-- tests/
|-- next.config.*
`-- package.json

supabase/
|-- config.toml
|-- migrations/
`-- seed.sql

docs/
`-- local-foundation.md

.env.example
```

**Structure Decision**: Use a monorepo-style root with separate `frontend/`,
`backend/`, and `supabase/` directories. This matches the long-term architecture
while keeping Phase 1 bounded to local foundation work.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Local-only Phase 1 despite cloud-native constitution | User clarified cloud deployment setup is deferred | Preview/production setup would expand Phase 1 beyond foundation goals |

## Phase 0: Research

See [research.md](./research.md). All planning decisions are resolved; no
remaining `NEEDS CLARIFICATION` items.

## Phase 1: Design & Contracts

Design artifacts:
- [data-model.md](./data-model.md)
- [contracts/health.openapi.yaml](./contracts/health.openapi.yaml)
- [quickstart.md](./quickstart.md)

Post-design Constitution Check remains PASS. The only scoped exception is still
the clarified local-only deployment boundary, documented above and in the spec.
