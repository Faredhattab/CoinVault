<!--
Sync Impact Report
Version change: 1.2.0 -> 1.3.0
Modified principles:
- V. Cloud-Native, Documented Operation (expanded with documentation consolidation and temporary marking rules)
Added sections:
- None
Removed sections:
- None
Templates requiring updates:
- ? updated: .specify/templates/plan-template.md
- ? updated: .specify/templates/spec-template.md
- ? updated: .specify/templates/tasks-template.md
- ? updated: .specify/templates/checklist-template.md
Follow-up TODOs:
- None
-->
# CoinVault Constitution

## Core Principles

### I. Clean Code by Default
Code MUST be simple, readable, and intentionally structured. Every change MUST
use descriptive names, small cohesive modules, explicit data contracts, and
framework patterns already established in the project. Dead code, duplicated
logic, hidden side effects, and avoidable complexity MUST be removed before a
feature is considered complete. Rationale: CoinVault handles financial product
experiences where clarity directly reduces defects and maintenance risk.

### II. Tested Behavior for Every Function
Every production function MUST have automated test coverage that verifies normal
behavior, error paths, and important edge cases. New work MUST add or update unit
tests for pure logic, integration tests for cross-boundary behavior, and UI tests
for user-facing flows. Tests MUST be written early enough to fail before the
implementation when behavior is new or changed. Rationale: untested financial
logic and UX flows are not shippable.

### III. Minimalist, Modern UX
User interfaces MUST be focused, accessible, and visually restrained. Each screen
MUST prioritize the user's primary task, avoid decorative clutter, use clear
hierarchy, and expose only controls that serve the current workflow. Components
MUST follow a consistent design system and meet accessibility expectations for
keyboard navigation, focus states, contrast, semantic structure, and language
switching. Rationale: minimalist UX makes financial decisions easier to
understand and trust.

### IV. Mobile-First Responsive Design
All user-facing experiences MUST be designed and validated from the smallest
supported mobile viewport outward. Layouts MUST adapt across mobile, tablet, and
desktop without overlapping content, horizontal scrolling, clipped controls, or
loss of core functionality. Touch targets, form flows, navigation, and data
density MUST be usable on mobile before desktop enhancements are added.
English left-to-right and Arabic right-to-left layouts MUST both be validated at
supported breakpoints. Rationale: CoinVault must work well where users actually
check and manage money.

### V. Cloud-Native, Documented Operation
The system MUST be deployable, observable, and configurable in cloud-native
environments. Runtime behavior MUST use environment-based configuration,
stateless FastAPI application services where practical, structured logging,
health checks, and documented operational assumptions. Documentation MUST live
with the feature and be updated in the same change as code, tests, contracts,
and deployment expectations. Non-SpecKit documentation MUST be consolidated into
README.md or quickstart.md. Temporary documentation MUST be marked with [TMP] and
will be removed in the next documentation update. Rationale: reliable cloud
operation requires software that can be deployed, diagnosed, and evolved without
tribal knowledge.

### VI. Multilingual and RTL Support
The application MUST provide full multilingual support. English MUST be the
default language, and Arabic MUST be a fully supported secondary language with
complete right-to-left layout behavior. User-facing text MUST be externalized
from code, locale selection MUST be consistent across navigation and flows, and
dates, numbers, currency, validation messages, empty states, errors, and
notifications MUST render correctly in both languages. Rationale: language
support is a product requirement, not a post-release translation pass.

## Technology Standards

The frontend MUST use Next.js unless an amendment explicitly approves another
frontend framework. TypeScript SHOULD be used for all new frontend code where the
toolchain supports it. Feature plans MUST declare the target Next.js rendering
model, data-fetching approach, state boundaries, test framework, and deployment
environment.

The backend MUST use FastAPI unless an amendment explicitly approves another
backend framework. Backend services MUST expose typed request and response
contracts, use dependency injection for external services, document API
behavior through generated OpenAPI metadata, and keep business logic testable
outside route handlers.

Frontend implementation MUST use an internationalization approach compatible
with Next.js routing, rendering, metadata, and accessibility. Locale resources
MUST support English and Arabic from the start of each user-facing feature.

Cloud-native implementation MUST prefer managed service integrations,
environment-specific configuration, reproducible builds, and automated validation
over machine-local assumptions. Secrets MUST NOT be committed to the repository.

Living documentation is mandatory. Each feature MUST keep its specification,
plan, quickstart, contracts, and operational notes accurate enough for a new
contributor to understand, test, and deploy the feature. All non-SpecKit
documentation MUST reside in README.md or quickstart.md. Temporary notes MUST be
marked with [TMP].

## Development Workflow

Every feature MUST pass the Constitution Check before research begins and again
after design. The check MUST explicitly cover clean-code impact, test coverage
for every production function, minimalist UX, mobile-first responsive behavior,
English and Arabic localization with RTL behavior, Next.js frontend fit,
FastAPI backend fit, cloud-native operation, and living documentation updates
including document consolidation and [TMP] marking rules.

Implementation tasks MUST be organized by independently testable user story.
Tests MUST be created before or alongside the implementation task they verify,
and a story is incomplete until its tests and documentation pass review.

Reviews MUST reject changes that introduce untested production functions,
unclear abstractions, desktop-only UX, hard-coded user-facing strings, broken
Arabic RTL behavior, undocumented operational assumptions, or framework choices
that bypass the Next.js or FastAPI standards without an approved constitutional
amendment.

## Governance

This constitution supersedes conflicting project practices, templates, and ad
hoc guidance. Amendments require an explicit rationale, impact summary, updated
dependent templates, and a version change recorded in the Sync Impact Report.

Versioning follows semantic versioning. MAJOR changes redefine or remove core
principles, MINOR changes add principles or materially expand governance, and
PATCH changes clarify wording without changing obligations.

Compliance review is mandatory at specification, planning, task generation,
implementation, and review time. Any approved exception MUST be documented in the
feature plan's Complexity Tracking section with the reason, rejected simpler
alternative, owner, and review date.

**Version**: 1.3.0 | **Ratified**: 2026-05-11 | **Last Amended**: 2026-05-18
