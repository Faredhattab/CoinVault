# Data Model: Project Foundation

Phase 1 does not create collection-domain entities such as items, categories,
subscribers, or statistics records. It defines foundation entities used to run,
verify, and document the local application.

## Environment Configuration

**Purpose**: Names and validates settings required for local operation and future
deployment documentation.

**Fields**:
- `name`: Stable setting name, e.g., `DATABASE_URL`.
- `scope`: `frontend`, `backend`, `supabase`, or `shared`.
- `required_for_local`: Boolean; true when local startup fails without it.
- `secret`: Boolean; true when value must never be committed or logged.
- `example_value`: Safe placeholder value for `.env.example`.
- `description`: Human-readable purpose.

**Validation Rules**:
- Every required local setting MUST appear in `.env.example`.
- Secret settings MUST use placeholder values only.
- Documentation MUST identify preview/production settings as deferred.

## Service Connection

**Purpose**: Represents the local service checks required by the health contract.

**Fields**:
- `service`: One of `web`, `backend`, `database`, `auth`, `storage`.
- `status`: `ok`, `degraded`, or `unavailable`.
- `checked_at`: ISO-8601 timestamp generated at check time.
- `latency_ms`: Optional measured latency for services that can be probed.
- `message`: Short user-safe diagnostic message.

**Validation Rules**:
- Aggregate health is `ok` only when all required services are `ok`.
- Aggregate health is `degraded` when at least one optional check is degraded.
- Aggregate health is `unavailable` when any required service is unavailable.
- Messages MUST NOT include secrets or raw credentials.

## Validation Workflow

**Purpose**: Defines the manual-release quality gate.

**Fields**:
- `name`: Release validation workflow name.
- `trigger`: `manual_release`.
- `checks`: Ordered list of validation checks.
- `result`: `pass` or `fail`.
- `completed_at`: ISO-8601 timestamp when validation completes.

**Validation Rules**:
- Required checks include code quality, tests, build readiness, and documentation.
- A manual release candidate fails when any required check fails.
- Results MUST be visible to maintainers before sharing the release.

## Deferred Deployment Scope

**Purpose**: Documents deployment work intentionally excluded from Phase 1.

**Fields**:
- `scope_item`: Deferred deployment capability.
- `reason`: Why it is deferred.
- `target_phase`: Later phase or "post-foundation".

**Validation Rules**:
- Preview and production deployment setup MUST be listed as deferred.
- Phase 1 documentation MUST explain that local-only setup is intentional.
