# CoinVault

A cloud-native, mobile-first multilingual web application for managing and showcasing personal collections of coins and banknotes.

[![Phase](https://img.shields.io/badge/Phase-3%20Collection%20Data%20Model-blue)](PLAN.md)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%2B%20FastAPI-green)](PLAN.md)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20Arabic-orange)](PLAN.md)

## 📝 Summary

**CoinVault** is a specialized numismatic platform designed for collectors to manage and publicly showcase their coins and banknotes. Built with a focus on mobile-first usability and full Arabic (RTL) support, it provides a secure admin environment for collection management and a beautiful, accessible gallery for visitors.

The project follows a **Spec-Driven Development (SDD)** approach, ensuring high quality and comprehensive test coverage. Currently in Phase 3 with the full collection data model complete: hierarchical categories, item CRUD with auto-generated IDs, visibility control, multilingual support, and a public gallery — all backed by 146 automated tests.

## ⚡ Quick Start

```bash
# 1. Start Supabase (requires Docker)
supabase start

# 2. Configure environment
cp .env.example .env
# Edit .env with keys from step 1

# 3. Setup Backend
cd backend
pip install -e ".[dev]"
python -m coinvault.db.seeds.run_seeds
python -m uvicorn coinvault.main:app --app-dir src --reload

# 4. Setup Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

**Verify**: [localhost:3000/en](http://localhost:3000/en) | [localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 📊 Project Status

**Phase 3 Development**: Collection Data Model
**Grade**: **A (100/100)** - Core data model, triggers, RLS, and admin UI fully implemented.

### Test Coverage
- **Backend**: 91/91 tests passing (100%)
  - Unit tests: 67 tests (auth, sessions, rate limiting, OAuth, categories, items, triggers)
  - Integration tests: 24 tests (endpoints, RBAC, health, session management)
- **Frontend Unit**: 22/22 tests passing (100%)
- **Frontend E2E**: 33/33 tests passing (100%)
- **Overall**: 146/146 tests passing (100%)

### Recent Cleanup (2026-05-22)

| Removed | Reason |
|---------|--------|
| `tests/example.spec.ts` | Playwright boilerplate test pointing to playwright.dev |
| `frontend/src/dummy.test.ts` | Placeholder `1+1=2` test with no real value |
| `AGENTS.md`, `GEMINI.md` | Empty SpecKit placeholder files (no content) |
| `backend/alembic.ini` | Unused — project uses Supabase migrations, not Alembic |
| Root `package.json`, `package-lock.json`, `playwright.config.ts` | Redundant root-level Playwright setup (real tests in `frontend/`) |
| `scripts/validate-release.ps1` | Outdated — references deleted files |
| `frontend/tsconfig.tsbuildinfo` | Build artifact, now gitignored |
| `alembic` dependency in `pyproject.toml` | Never used |

**Also fixed**: CI workflow now runs Playwright from `frontend/` with correct config.

### Recent Fixes (2026-05-21)

| Issue | Severity | Fix |
|-------|----------|-----|
| **i18n compliance** – 150+ hardcoded strings in Phase 3 pages | Critical | Externalized all strings to en.json/ar.json with full Arabic translations |
| **Oversized SVG icons** – settings page provider icons rendering too large | Medium | Replaced with lucide-react `Mail` + explicit SVG dimensions |

---
### Recent Fixes (2026-05-18)

| Issue | Severity | Fix |
|-------|----------|-----|
| **Logout endpoint was a stub** — returned success without revoking the DB session | Critical | Now revokes session + writes `logout` event to `auth_audit_log` |
| **INET column mismatch** — PostgREST `.eq()` compared `127.0.0.1` vs `127.0.0.1/32` (never matched) | Critical | Migration converts `sessions.ip_address` and `auth_audit_log.ip_address` from INET to TEXT |
| **Middleware session lookup broken** — same INET bug prevented session identification in `get_current_user` | High | Removed stale `.eq("ip_address", ...)` from middleware; now matches on `user_agent` only |
| **Fragile date parsing** — manual `.replace("Z", "+00:00")` scattered in 5 locations | Medium | Removed; Python 3.11+ `fromisoformat()` handles "Z" natively |
| **Audit trail gap** — no `logout` event written to audit log | Medium | Logout endpoint now inserts audit row with user_id, session_id, ip, user_agent |

### Core Features (Phase 3 - Collection Data Model)
- **Category Management**: Hierarchical categories (3-level depth limit) with cycle detection, full CRUD with Arabic/English names.
- **Item Management**: Full CRUD for coins and banknotes with multilingual titles/descriptions, auto-generated collection IDs (e.g. NL-0001), country codes, denomination, year, and stock tracking.
- **Visibility Control**: Items can be set to Public or Private; private items are hidden from public API endpoints and gallery.
- **Image References**: Front/back image URLs with preview in admin forms.
- **Category Associations**: Items can be tagged with multiple categories for organization.
- **Search Tags**: Comma-separated tags for enhanced discoverability.
- **Public Gallery**: Individual item showcase pages with responsive layout and RTL support.
- **Database Triggers**: Auto-generation of sequential collection IDs, depth-limit enforcement, and RLS policies.

### Core Features (Phase 2 - Authentication)
- **Email/Password Authentication**: Secure login with complex password requirements.
- **Google OAuth Login**: Seamless one-click authentication using Google accounts.
- **Protected Admin Routes**: Frontend and backend guards to ensure only authorized users access management features.
- **Smart Session Management**:
    - **3-Device Limit**: Enforces a maximum of 3 active sessions per user via database triggers.
    - **Auto-Renewal**: Detects returning devices via IP and User-Agent to renew existing sessions instead of hitting limits.
    - **Live Monitoring**: Real-time session list in admin dashboard with remote revocation.
- **Account Linking**: Connect existing email accounts with Google OAuth for flexible login.
- **Multilingual Support**: Full English (LTR) and Arabic (RTL) localization including date/time formatting.

### Security Highlights
- ✅ Multi-layer RBAC (Frontend → Backend → Database RLS).
- ✅ Rate limiting (5 attempts per 15 minutes) to prevent brute-force attacks.
- ✅ OAuth 2.0 secure flow with state validation and PKCE.
- ✅ Comprehensive audit logging for all authentication events.
- ✅ OWASP Top 10 compliant security architecture.

---

## 📖 Features Reference

### 1. Authentication Methods
- **Email/Password**: Traditional authentication with 12+ character passwords, uppercase, lowercase, numbers, and special characters.
- **Google OAuth**: One-click sign-in with Google accounts.
- **Account Linking**: Users can link multiple authentication methods to a single account from settings.
- **Provider Management**: View and manage linked providers from account settings.

### 2. OAuth API Endpoints
The following OAuth endpoints are available for integration:

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/v1/auth/oauth/google` | GET | Initiate Google OAuth flow | None |
| `/api/v1/auth/oauth/google/callback` | GET | Handle OAuth callback from Google | None |
| `/api/v1/auth/link/google` | POST | Link Google account to existing user | Required |
| `/api/v1/auth/link/google` | DELETE | Unlink Google account from user | Required |

### 3. Session Management
- **Auto-Renewal**: Uses IP + User-Agent to detect returning devices and renew sessions instead of creating new ones.
- **Limit Enforcement**: Strictly enforces 3 active sessions per user via database triggers.
- **Cleanup**: Background job (pg_cron) runs hourly to deactivate expired sessions.

### 4. Collection API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/v1/categories` | GET | List all categories | None |
| `/api/v1/categories` | POST | Create category | Required (Admin) |
| `/api/v1/categories/{uuid}` | PUT | Update category | Required (Admin) |
| `/api/v1/categories/{uuid}` | DELETE | Delete category | Required (Admin) |
| `/api/v1/items` | GET | List items (public see only Public) | Optional |
| `/api/v1/items` | POST | Create item | Required (Admin) |
| `/api/v1/items/{uuid}` | GET | Get item details | Optional |
| `/api/v1/items/{uuid}` | PUT | Update item | Required (Admin) |
| `/api/v1/items/{uuid}` | DELETE | Delete item | Required (Admin) |

### 5. OAuth Configuration (Local Development)
1. Open Supabase Studio: [http://localhost:54323](http://localhost:54323)
2. Navigate to **Authentication** → **Providers** → **Google**
3. Enable provider and enter credentials (real or test).
4. For real testing, use [Google Cloud Console](https://console.cloud.google.com/) with redirect URI: `http://localhost:54321/auth/v1/callback`

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS 4, TypeScript, next-intl.
- **Backend**: FastAPI (Python 3.12), Pydantic, slowapi.
- **Database**: PostgreSQL (Supabase), Row-Level Security (RLS).
- **Testing**: Pytest (Backend), Vitest (Frontend Unit), Playwright (E2E).
- **Workflow**: Spec-Driven Development with SpecKit.

## 🌍 Localization

Fully supports **English (LTR)** and **Arabic (RTL)** with locale-aware routing and layout. Language switching is consistent across all application states.

## 🔐 Security

- Backend-authoritative authentication & session management.
- Multi-layer Role-Based Access Control (RBAC).
- Comprehensive audit logging and rate limiting.

---

**Full setup guide**: See [quickstart.md](quickstart.md) for detailed installation, testing, and deployment instructions.

**Built with**: Next.js • FastAPI • PostgreSQL • Supabase • TypeScript • Python • Tailwind CSS
