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
| **E2E (Playwright)** | `cd frontend && npx playwright test` | Full browser flows |

### 3.2 Manual Testing Checklist
- [ ] **Email Login**: Correct credentials vs incorrect.
- [ ] **Input Validation**: Test empty fields and invalid email formats.
- [ ] **Rate Limiting**: Verify lock-out after 5 failed attempts.
- [ ] **RTL Support**: Navigate to `/ar/login` and verify layout.
- [ ] **Session Renewal**: Log in twice from the same browser; verify only one session exists in `/admin/sessions`.
- [ ] **Session Limit**: Log in from 3 different browsers, then try a 4th.
- [ ] **Protected Routes**: Try accessing `/en/admin` without logging in.

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

## 📖 6. Features Reference

### 6.1 Session Management
- **Auto-Renewal**: Uses IP + User-Agent to detect returning devices and renew sessions instead of creating new ones.
- **Limit Enforcement**: Strictly enforces 3 active sessions per user via database triggers.
- **Cleanup**: Background job (pg_cron) runs hourly to deactivate expired sessions.

### 6.2 Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS 4, next-intl.
- **Backend**: FastAPI, Python 3.12, Supabase-py.
- **Infrastructure**: Local Supabase (Docker), Playwright.
