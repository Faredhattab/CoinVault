# CoinVault Quickstart Guide

This guide provides everything you need to get CoinVault running locally, verify your setup, and perform common development tasks.

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
