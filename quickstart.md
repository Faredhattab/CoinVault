# CoinVault Quickstart Guide

This guide provides everything you need to get CoinVault running locally, verify your setup, and perform common development tasks.

---

## Features

### Collection Management (Phase 3)
- **Category Hierarchy**: Create and manage categories up to 3 levels deep with cycle detection and depth enforcement via DB triggers.
- **Item CRUD**: Full create/read/update/delete for coins and banknotes with multilingual titles and descriptions (English + Arabic).
- **Auto-Generated IDs**: Collection IDs auto-generated from country code using advisory locks for concurrency safety (e.g. `NL-0001`, `US-0042`).
- **Visibility Control**: Toggle items between Public (gallery-visible) and Private (admin-only); private items fully masked from public API.
- **Image References**: Attach front/back image URLs with live preview in admin forms.
- **Category Tagging**: Associate items with one or more categories for multi-dimensional filtering and organization.
- **Search Tags**: Comma-separated tags for discoverability across the gallery.
- **Public Item Gallery**: Responsive showcase pages for individual items with full RTL Arabic support.
- **Database RLS**: Row-Level Security policies ensure private items and sensitive inventory data (quantity, acquisition year) are never exposed to unauthenticated users.
- **Admin Item Table**: Sortable/filterable table with search by ID, title, denomination, or country; type and category filters.
- **Multilingual Fallback**: Arabic titles/descriptions fall back gracefully to English when not provided.

### Authentication & Security (Phase 2)
- **Email/Password Login**: 12+ char passwords with uppercase, lowercase, numbers, and special characters.
- **Google OAuth**: One-click sign-in and account linking/unlinking from settings.
- **Session Management**: 3-device limit enforced by DB trigger, auto-renewal for returning devices, remote revocation from admin dashboard.
- **Rate Limiting**: 5 failed attempts per 15 minutes before lockout.
- **Role-Based Access**: Multi-layer RBAC (Frontend guard, Backend middleware, Database RLS).
- **Audit Logging**: All authentication events (login, logout, OAuth, linking) recorded with IP, user-agent, and timestamps.
- **Account Linking**: Connect email/password and Google OAuth methods on a single account; cannot unlink last provider.

### Platform & UX (Phase 1)
- **Mobile-First Design**: Validated on mobile viewports before desktop; touch-friendly controls.
- **Full i18n**: English (LTR) and Arabic (RTL) with locale-aware routing, dates, numbers, and validation messages. All user-facing strings externalized to JSON locale files.
- **Health Dashboard**: Real-time status of web, backend, database, auth, and storage services.
- **Spec-Driven Development**: SpecKit workflow with constitution checks at every phase.
- **Accessible Navigation**: Keyboard navigable, semantic HTML, proper focus states and contrast.

### Technical Highlights
- **146 Automated Tests**: 91 backend (unit + integration), 22 frontend unit, 33 E2E Playwright tests — all passing.
- **Type-Safe API**: FastAPI with Pydantic models + TypeScript frontend services with strict typing.
- **Concurrent-Safe ID Generation**: PostgreSQL advisory locks serialize collection ID generation per country code.
- **Database Triggers**: Auto-increment collection IDs, depth-limit enforcement, session-limit enforcement, cycle detection.
- **Zero Hardcoded Strings**: Full i18n compliance across all admin and public pages in both English and Arabic.

---

## 🚀 1. Fast Track (5-Minute Setup)

### 1.1 Prerequisites
Ensure you have the following installed:
- **Node.js** (20.9+)
- **Python** (3.12+)
- **Docker Desktop** (Running)
- **Supabase CLI** (`npm install -g supabase`)

### 1.2 Installation
```bash
# 1. Clone & Enter
git clone https://github.com/Faredhattab/CoinVault.git
cd CoinVault

# 2. Start Supabase (Ensure Docker is running!)
supabase start

# 3. Environment Setup
cp .env.example .env
# Edit .env and paste the SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
# from the 'supabase start' output.

# 4. Backend Setup
cd backend
pip install -e ".[dev]"
python -m coinvault.db.seeds.run_seeds      # Creates admin user
python -m uvicorn coinvault.main:app --app-dir src --reload --port 8000

# 5. Frontend Setup (New Terminal)
cd frontend
npm install
npm run dev
```

---

## ✅ 2. Verification

### 2.1 Essential URLs
| Service | URL | Expected |
|---------|-----|----------|
| **App (English)** | [localhost:3000/en](http://localhost:3000/en) | Homepage loads |
| **App (Arabic)** | [localhost:3000/ar](http://localhost:3000/ar) | RTL interface loads |
| **Health Check** | [localhost:3000/en/health](http://localhost:3000/en/health) | All services "Healthy" |
| **API Docs** | [localhost:8000/docs](http://localhost:8000/docs) | Swagger UI |
| **Database** | [localhost:54323](http://localhost:54323) | Supabase Studio |

### 2.2 Test Credentials (Local Admin)
- **Email**: `admin@example.com`
- **Password**: `SecurePassword123!`

---

## 🧪 3. Testing Guide

### 3.1 Automated Tests
| Suite | Command | Notes |
|-------|---------|-------|
| **Backend Unit** | `cd backend && pytest` | Includes coverage & logic |
| **Frontend Unit** | `cd frontend && npm test` | Vitest components/hooks |
| **E2E (Playwright)** | `cd frontend && npx playwright test --workers=1` | Full browser flows (run serially to prevent session limit conflicts) |

### 3.2 Manual Testing Checklist

#### Basic Authentication
- [ ] **Email Login**: Correct credentials vs incorrect.
- [ ] **Input Validation**: Test empty fields and invalid email formats.
- [ ] **Rate Limiting**: Verify lock-out after 5 failed attempts.
- [ ] **RTL Support**: Navigate to `/ar/login` and verify layout.

#### Google OAuth
- [ ] **OAuth Login**: Click "Sign in with Google" button on login page.
- [ ] **OAuth Callback**: Verify successful redirect after Google authentication.
- [ ] **Account Linking**: Log in with email/password, go to settings, link Google account.
- [ ] **Account Unlinking**: From settings, unlink Google account (requires password method).
- [ ] **Cannot Unlink Last Provider**: Try unlinking when it's the only auth method.

#### Session Management
- [ ] **Session Renewal**: Log in twice from the same browser; verify only one session exists in `/admin/sessions`.
- [ ] **Session Limit**: Log in from 3 different browsers, then try a 4th.
- [ ] **Protected Routes**: Try accessing `/en/admin` without logging in.

#### Role Management
- [ ] **Admin Access**: Log in with admin credentials, verify full access to all admin pages.
- [ ] **Role Display**: Go to Settings, verify role badge shows "Administrator".
- [ ] **Non-Admin Denial**: If a non-admin user attempts to access `/en/admin`, verify redirect to forbidden page.
- [ ] **Forbidden Page**: Verify the 403 forbidden page shows appropriate error message and navigation options.
- [ ] **API Role Enforcement**: Call `GET /api/v1/health` without admin role, verify 403 response.
#### Category Management
- [ ] **Depth Limit**: Attempt to create a category hierarchy deeper than 3 levels; verify server rejects with appropriate error.
- [ ] **Cycle Detection**: Try to set a category's parent to one of its descendants; confirm operation is blocked.

#### Item Management
- [ ] **Prefix Generation**: Create a new item and ensure its `prefix` field is auto-generated correctly based on category path.
- [ ] **Visibility Masking**: Verify that items marked as hidden are not returned by public API endpoints.

---

## 🛠️ 4. Daily Workflows

### 4.1 Startup Routine
1. Start **Docker Desktop**.
2. `supabase start` (Project Root).
3. `cd backend && python -m uvicorn coinvault.main:app --app-dir src --reload`
4. `cd frontend && npm run dev`

### 4.2 Database & Migrations
- **Apply Migrations**: `supabase migration up`.
- **Reset Database**: `supabase db reset` (Warning: Clears all local data).
- **Update Seeds**: Edit `backend/src/coinvault/db/seeds/run_seeds.py` then run it.

---

## ❓ 5. Troubleshooting

| Symptom | Common Fix |
|---------|------------|
| **Supabase fails to start** | Ensure Docker Desktop is running. |
| **Backend 500 Error** | Restart backend to reload `.env`. Check `supabase status`. |
| **"Backend unavailable"** | Verify `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `.env`. |
| **ModuleNotFoundError** | Re-run `pip install -e ".[dev]"` in `backend/`. |
| **CORS Errors** | Ensure `CORS_ORIGINS` in `.env` includes `http://localhost:3000`. |

---

## 6. Production Deployment Checklist

- [ ] Set unique `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for production
- [ ] Set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` to strong credentials
- [ ] Configure `CORS_ORIGINS` to production frontend domain only
- [ ] Enable HTTPS on all endpoints
- [ ] Set `SESSION_TIMEOUT_DAYS` appropriately (default: 7)
- [ ] Configure Google OAuth redirect URIs for production domain in Google Cloud Console
- [ ] Update `site_url` and `additional_redirect_urls` in Supabase Auth config
- [ ] Remove placeholder keys and verify all `missing_required_values()` pass
- [ ] Run database migrations on production Supabase instance
- [ ] Seed initial admin account
- [ ] Verify health check returns all services "ok"
- [ ] Enable structured logging collection (e.g., CloudWatch, Datadog)
- [ ] Set up rate limiting with Redis instead of in-memory store
- [ ] Review RLS policies are active on all tables

---

**For detailed feature specifications, see [README.md](README.md) and the specs directory.**
