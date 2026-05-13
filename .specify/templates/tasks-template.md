---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED. Include unit tests for every production function, integration tests for cross-boundary behavior, and UI tests for user-facing flows in English and Arabic RTL.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Next.js + FastAPI web app**: `backend/src/`, `backend/tests/`, `frontend/app/` or `frontend/pages/`, `frontend/src/`, `frontend/tests/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  - Constitution gates for tests, clean code, minimalist mobile-first UX,
    English/Arabic RTL support, Next.js frontend work, FastAPI backend work,
    cloud-native operation, and living documentation
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies; use Next.js for frontend work and FastAPI for backend work
- [ ] T003 [P] Configure linting, formatting, and type-checking tools
- [ ] T004 [P] Configure automated unit, integration, and UI test tooling
- [ ] T005 [P] Configure internationalization resources for English default locale and Arabic RTL locale

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T006 Setup database schema and migrations framework
- [ ] T007 [P] Implement authentication/authorization framework
- [ ] T008 [P] Setup FastAPI routing, dependency injection, and middleware structure in backend/src/
- [ ] T009 Create base models/entities that all stories depend on
- [ ] T010 Configure error handling, structured logging, and health checks
- [ ] T011 Setup cloud-native environment configuration management
- [ ] T012 Document operational assumptions in quickstart.md or docs/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (REQUIRED)

> **NOTE: Write these tests FIRST and ensure they FAIL before implementation when behavior is new or changed**

- [ ] T013 [P] [US1] Unit tests for every production function in tests/unit/test_[name].py
- [ ] T014 [P] [US1] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T015 [P] [US1] Integration test for [user journey] in tests/integration/test_[name].py
- [ ] T016 [P] [US1] UI/responsive test for mobile-first flow in English in frontend/tests/[name].spec.ts
- [ ] T017 [P] [US1] UI/responsive test for Arabic RTL flow in frontend/tests/[name].rtl.spec.ts

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create [Entity1] model in src/models/[entity1].py
- [ ] T019 [P] [US1] Create [Entity2] model in src/models/[entity2].py
- [ ] T020 [US1] Implement [Service] in src/services/[service].py (depends on T018, T019)
- [ ] T021 [US1] Implement FastAPI [endpoint/feature] in backend/src/[location]/[file].py
- [ ] T022 [US1] Add validation and error handling
- [ ] T023 [US1] Add localized English and Arabic strings for all user-facing copy
- [ ] T024 [US1] Add structured logging for user story 1 operations
- [ ] T025 [US1] Update living documentation for behavior, tests, localization, and operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (REQUIRED)

- [ ] T026 [P] [US2] Unit tests for every production function in tests/unit/test_[name].py
- [ ] T027 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T028 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py
- [ ] T029 [P] [US2] UI/responsive test for mobile-first flow in English in frontend/tests/[name].spec.ts
- [ ] T030 [P] [US2] UI/responsive test for Arabic RTL flow in frontend/tests/[name].rtl.spec.ts

### Implementation for User Story 2

- [ ] T031 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T032 [US2] Implement [Service] in src/services/[service].py
- [ ] T033 [US2] Implement FastAPI [endpoint/feature] in backend/src/[location]/[file].py
- [ ] T034 [US2] Add localized English and Arabic strings for all user-facing copy
- [ ] T035 [US2] Integrate with User Story 1 components (if needed)
- [ ] T036 [US2] Update living documentation for behavior, tests, localization, and operations

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (REQUIRED)

- [ ] T037 [P] [US3] Unit tests for every production function in tests/unit/test_[name].py
- [ ] T038 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T039 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py
- [ ] T040 [P] [US3] UI/responsive test for mobile-first flow in English in frontend/tests/[name].spec.ts
- [ ] T041 [P] [US3] UI/responsive test for Arabic RTL flow in frontend/tests/[name].rtl.spec.ts

### Implementation for User Story 3

- [ ] T042 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T043 [US3] Implement [Service] in src/services/[service].py
- [ ] T044 [US3] Implement FastAPI [endpoint/feature] in backend/src/[location]/[file].py
- [ ] T045 [US3] Add localized English and Arabic strings for all user-facing copy
- [ ] T046 [US3] Update living documentation for behavior, tests, localization, and operations

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Living documentation updates in specs/, docs/, and quickstart.md
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit, integration, and UI tests for uncovered paths
- [ ] TXXX Security hardening
- [ ] TXXX Validate mobile-first responsive behavior across supported breakpoints
- [ ] TXXX Validate English and Arabic RTL localization across supported breakpoints
- [ ] TXXX Validate cloud-native configuration, logging, health checks, and deployment assumptions
- [ ] TXXX Validate FastAPI OpenAPI metadata, dependency wiring, and route contracts
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 -> P2 -> P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and fail before implementation when behavior is new or changed
- Models before services
- Services before endpoints
- Core implementation before integration
- Documentation updates before story completion
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit tests for every production function in tests/unit/test_[name].py"
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"
Task: "UI/responsive test for mobile-first English flow in frontend/tests/[name].spec.ts"
Task: "UI/responsive test for Arabic RTL flow in frontend/tests/[name].rtl.spec.ts"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy/Demo (MVP)
3. Add User Story 2 -> Test independently -> Deploy/Demo
4. Add User Story 3 -> Test independently -> Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing new or changed behavior
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, untested production functions, desktop-only UX, hard-coded user-facing strings, missing Arabic RTL coverage, non-FastAPI backend endpoints without approved exception, stale documentation, same file conflicts, cross-story dependencies that break independence
