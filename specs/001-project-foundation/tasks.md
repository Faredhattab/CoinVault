---

description: "Task list for Project Foundation implementation"
---

# Tasks: Project Foundation

**Input**: Design documents from `/specs/001-project-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED. Include unit tests for every production function, integration tests for cross-boundary behavior, and UI tests for user-facing flows in English and Arabic RTL.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js frontend**: `frontend/app/`, `frontend/src/`, `frontend/tests/`
- **FastAPI backend**: `backend/src/`, `backend/tests/`
- **Local services**: `supabase/`
- **Documentation**: `docs/`, `specs/001-project-foundation/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the repository structure and toolchain used by all stories.

- [X] T001 Create monorepo directories `frontend/`, `backend/`, `supabase/`, `docs/`, and `scripts/`
- [X] T002 Initialize Next.js TypeScript app with Tailwind CSS and App Router in `frontend/package.json`
- [X] T003 Initialize FastAPI Python 3.12 project metadata in `backend/pyproject.toml`
- [X] T004 [P] Create backend package structure in `backend/src/coinvault/__init__.py`, `backend/src/coinvault/main.py`, `backend/src/coinvault/api/__init__.py`, `backend/src/coinvault/core/__init__.py`, and `backend/src/coinvault/services/__init__.py`
- [X] T005 [P] Create frontend base folders in `frontend/app/[locale]/`, `frontend/src/components/`, `frontend/src/i18n/`, and `frontend/src/lib/`
- [X] T006 [P] Configure frontend linting, formatting, and type checks in `frontend/eslint.config.*`, `frontend/tsconfig.json`, and `frontend/package.json`
- [X] T007 [P] Configure backend linting, formatting, typing, and test commands in `backend/pyproject.toml`
- [X] T008 [P] Configure frontend unit and UI test tooling in `frontend/package.json` and `frontend/tests/`
- [X] T009 [P] Configure backend unit and integration test tooling in `backend/pyproject.toml`, `backend/tests/unit/`, and `backend/tests/integration/`
- [X] T010 [P] Add initial English and Arabic locale resource files in `frontend/src/i18n/en.json` and `frontend/src/i18n/ar.json`
- [X] T011 Create root ignore and environment example files in `.gitignore` and `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared local services, configuration, contracts, and application shells required before story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T012 Configure local Supabase project in `supabase/config.toml`
- [X] T013 Create initial Supabase migration placeholder in `supabase/migrations/00000000000000_foundation.sql`
- [X] T014 Create local Supabase seed placeholder in `supabase/seed.sql`
- [X] T015 Define backend settings model and safe secret redaction in `backend/src/coinvault/core/config.py`
- [X] T016 Define health response models matching `contracts/health.openapi.yaml` in `backend/src/coinvault/api/health.py`
- [X] T017 Create FastAPI application factory and router registration in `backend/src/coinvault/main.py`
- [X] T018 Create frontend locale routing layout with `dir` and `lang` handling in `frontend/app/[locale]/layout.tsx`
- [X] T019 Create frontend i18n loader utilities in `frontend/src/i18n/index.ts`
- [X] T020 Create shared status display component in `frontend/src/components/ServiceStatusList.tsx`
- [X] T021 Add local development command documentation skeleton in `docs/local-foundation.md`
- [X] T022 Add manual-release validation script skeleton in `scripts/validate-release.ps1`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Start the Application Locally (Priority: P1) MVP

**Goal**: A new contributor can start frontend, backend, and local services from a clean checkout and verify public/admin placeholders plus health status.

**Independent Test**: Follow `docs/local-foundation.md` to start local services, backend, and frontend; verify English and Arabic placeholder screens plus aggregate/per-service health.

### Tests for User Story 1 (REQUIRED)

> **NOTE: Write these tests FIRST and ensure they FAIL before implementation when behavior is new or changed**

- [X] T023 [P] [US1] Add backend unit tests for aggregate health status calculation in `backend/tests/unit/test_health_models.py`
- [X] T024 [P] [US1] Add backend integration test for `/health` response contract in `backend/tests/integration/test_health_endpoint.py`
- [X] T025 [P] [US1] Add frontend UI test for English public and admin placeholder screens in `frontend/tests/placeholders.en.spec.ts`
- [X] T026 [P] [US1] Add frontend UI test for Arabic RTL public and admin placeholder screens in `frontend/tests/placeholders.ar.spec.ts`
- [X] T027 [P] [US1] Add frontend UI test for health/status display in `frontend/tests/health.spec.ts`

### Implementation for User Story 1

- [X] T028 [P] [US1] Implement local database health probe in `backend/src/coinvault/services/database_health.py`
- [X] T029 [P] [US1] Implement local auth health probe in `backend/src/coinvault/services/auth_health.py`
- [X] T030 [P] [US1] Implement local storage health probe in `backend/src/coinvault/services/storage_health.py`
- [X] T031 [US1] Implement aggregate `/health` FastAPI route with per-service statuses in `backend/src/coinvault/api/health.py`
- [X] T032 [US1] Wire health router into FastAPI app in `backend/src/coinvault/main.py`
- [X] T033 [P] [US1] Implement localized public placeholder screen in `frontend/app/[locale]/page.tsx`
- [X] T034 [P] [US1] Implement localized admin placeholder screen in `frontend/app/[locale]/admin/page.tsx`
- [X] T035 [US1] Implement localized health/status screen in `frontend/app/[locale]/health/page.tsx`
- [X] T036 [US1] Add English and Arabic placeholder and health strings in `frontend/src/i18n/en.json` and `frontend/src/i18n/ar.json`
- [X] T037 [US1] Document local startup and health verification steps in `docs/local-foundation.md`

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - Configure Local Environment Safely (Priority: P2)

**Goal**: A maintainer can prepare local configuration safely, with no committed secrets and clear deferred deployment boundaries.

**Independent Test**: Copy `.env.example`, fill local-only values, start checks, and confirm preview/production setup is documented as deferred.

### Tests for User Story 2 (REQUIRED)

- [X] T038 [P] [US2] Add backend unit tests for required local settings and secret redaction in `backend/tests/unit/test_config.py`
- [X] T039 [P] [US2] Add repository test that `.env.example` contains no real secrets in `backend/tests/unit/test_env_example.py`
- [X] T040 [P] [US2] Add documentation validation test for deferred deployment notes in `backend/tests/unit/test_docs_deployment_scope.py`

### Implementation for User Story 2

- [X] T041 [US2] Complete safe local settings template in `.env.example`
- [X] T042 [US2] Implement required local settings validation in `backend/src/coinvault/core/config.py`
- [X] T043 [US2] Add user-safe missing configuration messages to `backend/src/coinvault/api/health.py`
- [X] T044 [US2] Document required local values, secret handling, and deferred deployment scope in `docs/local-foundation.md`
- [X] T045 [US2] Update quickstart validation notes in `specs/001-project-foundation/quickstart.md`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Validate Manual Releases (Priority: P3)

**Goal**: A maintainer can run one manual-release validation workflow that reports code quality, tests, build readiness, and documentation status.

**Independent Test**: Run the release validation script and confirm it reports pass/fail status for all required checks.

### Tests for User Story 3 (REQUIRED)

- [X] T046 [P] [US3] Add script behavior tests or smoke checks for release validation command in `backend/tests/integration/test_release_validation.py`
- [X] T047 [P] [US3] Add frontend build readiness check task to `frontend/package.json`
- [X] T048 [P] [US3] Add backend test command coverage to `backend/pyproject.toml`

### Implementation for User Story 3

- [X] T049 [US3] Implement manual-release validation script in `scripts/validate-release.ps1`
- [X] T050 [US3] Add root release validation command documentation in `docs/local-foundation.md`
- [X] T051 [US3] Update `specs/001-project-foundation/quickstart.md` with manual-release validation command and expected output
- [X] T052 [US3] Add validation checklist coverage for docs, contracts, and quickstart in `scripts/validate-release.ps1`

**Checkpoint**: All user stories are independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [X] T053 [P] Verify `specs/001-project-foundation/contracts/health.openapi.yaml` matches FastAPI `/health` output
- [ ] T054 [P] Verify mobile-first layout at 360px for `frontend/app/[locale]/page.tsx`, `frontend/app/[locale]/admin/page.tsx`, and `frontend/app/[locale]/health/page.tsx`
- [X] T055 [P] Verify Arabic RTL layout and text coverage in `frontend/src/i18n/ar.json`
- [X] T056 [P] Review backend health messages in `backend/src/coinvault/api/health.py` and `backend/src/coinvault/services/` for secret leakage
- [X] T057 Run full manual-release validation via `scripts/validate-release.ps1`
- [X] T058 Update `specs/001-project-foundation/plan.md`, `specs/001-project-foundation/data-model.md`, and `docs/local-foundation.md` if implementation decisions changed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion; may reuse US1 health surfaces but remains independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion; final validation is strongest after US1 and US2 are complete
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational - integrates with health/config surfaces but has independent tests
- **User Story 3 (P3)**: Can start after Foundational - validates available checks incrementally, then finalizes after US1/US2

### Within Each User Story

- Tests MUST be written and fail before implementation when behavior is new or changed
- Models/config/contracts before services
- Services before endpoints
- Endpoints before frontend health integration
- Documentation updates before story completion
- Story complete before moving to next priority unless staffing supports parallel work

### Parallel Opportunities

- T004-T010 can run in parallel after T001-T003
- T012-T014 can run in parallel with T015-T020
- T023-T027 can run in parallel
- T028-T030 can run in parallel
- T038-T040 can run in parallel
- T046-T048 can run in parallel
- T053-T056 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Add backend unit tests for aggregate health status calculation in backend/tests/unit/test_health_models.py"
Task: "Add backend integration test for /health response contract in backend/tests/integration/test_health_endpoint.py"
Task: "Add frontend UI test for English public and admin placeholder screens in frontend/tests/placeholders.en.spec.ts"
Task: "Add frontend UI test for Arabic RTL public and admin placeholder screens in frontend/tests/placeholders.ar.spec.ts"
Task: "Add frontend UI test for health/status display in frontend/tests/health.spec.ts"

# Launch all service probes for User Story 1 together:
Task: "Implement local database health probe in backend/src/coinvault/services/database_health.py"
Task: "Implement local auth health probe in backend/src/coinvault/services/auth_health.py"
Task: "Implement local storage health probe in backend/src/coinvault/services/storage_health.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate local startup, placeholders, health endpoint, and health screen

### Incremental Delivery

1. Complete Setup + Foundational -> local app skeleton ready
2. Add User Story 1 -> runnable local foundation with visible health
3. Add User Story 2 -> safe local configuration and deferred deployment docs
4. Add User Story 3 -> manual-release validation workflow
5. Complete polish checks -> foundation ready for implementation validation

### Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Developer A: User Story 1 health and placeholder flow
3. Developer B: User Story 2 configuration safety and docs
4. Developer C: User Story 3 validation workflow
5. Integrate with polish checks and manual-release validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing new or changed behavior
- Keep Phase 1 local-only; preview and production deployment setup is deferred
- Avoid hard-coded user-facing strings; use `frontend/src/i18n/en.json` and `frontend/src/i18n/ar.json`
- Avoid exposing secrets in health messages, logs, docs, tests, or validation output
