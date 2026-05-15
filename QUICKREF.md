# CoinVault Quick Reference

**One-page cheatsheet for daily development**

---

## 🚀 Startup (3 Commands)

```bash
# 1. Start Supabase (from project root)
supabase start

# 2. Backend (new terminal)
cd backend && python -m uvicorn coinvault.main:app --app-dir src --reload

# 3. Frontend (new terminal)
cd frontend && npm run dev
```

**Open**: http://localhost:3000/en

---

## 🔐 Test Credentials

- **Email**: `admin@example.com`
- **Password**: `SecurePassword123!`

---

## 📍 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000/en | Main app |
| **Login** | http://localhost:3000/en/login | Auth page |
| **Admin** | http://localhost:3000/en/admin | Protected route |
| **Arabic** | http://localhost:3000/ar/* | RTL localization |
| **Backend Health** | http://localhost:8000/api/v1/health | API status |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **Supabase Studio** | http://localhost:54323 | DB management |

---

## 🧪 Testing

```bash
# Backend (all checks)
cd backend && pytest && mypy src && ruff check src

# Frontend (all checks)
cd frontend && npm run check

# Individual tests
pytest -v                  # Backend tests only
npm test                   # Frontend unit tests
npm run test:ui           # Frontend UI tests (Playwright)
```

---

## 🛠️ Common Tasks

### Check if services are running
```bash
supabase status           # Supabase services
curl localhost:8000/api/v1/health  # Backend
curl localhost:3000       # Frontend
```

### Stop services
```bash
# Ctrl+C in backend/frontend terminals
supabase stop             # Stops Supabase
```

### Reset database (fresh start)
```bash
supabase db reset         # Drops tables, re-runs migrations & seeds
```

### View logs
```bash
# Supabase logs
supabase logs

# Backend logs (in terminal where uvicorn is running)
# Frontend logs (in terminal where npm run dev is running)
```

### Add new admin user
```sql
-- In Supabase Studio SQL Editor (http://localhost:54323):
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

---

## 🔧 Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Services won't start | Docker running? `supabase status` |
| Port already in use | Change port: `--port 8001` |
| Module not found | `pip install -e ".[dev]"` or `npm install` |
| Tests fail | `supabase db reset` |
| Can't login | Check admin was seeded: `cd backend/src && python -m coinvault.db.seeds.run_seeds` |

---

## 📂 File Locations

```
Backend:
├── backend/src/coinvault/api/auth.py         # Login endpoints
├── backend/src/coinvault/services/           # Business logic
├── backend/src/coinvault/middleware/         # Auth middleware
├── backend/migrations/*.sql                  # Database schema
└── backend/tests/                            # Tests

Frontend:
├── frontend/app/[locale]/login/page.tsx      # Login page
├── frontend/src/components/auth/LoginForm.tsx # Login form
├── frontend/src/hooks/useAuth.ts             # Auth hook
├── frontend/middleware.ts                    # Route protection
└── frontend/src/i18n/*.json                  # Translations
```

---

## 🔐 Security Notes

- ⚠️ Frontend auth bypasses backend session creation (see SECURITY-REVIEW.md)
- ✅ Never commit `.env` file
- ✅ Backend validates all requests (frontend middleware is UX only)
- ✅ Rate limiting: 5 failed logins per 15 minutes

---

## 📖 Full Documentation

- **[SETUP-GUIDE.md](SETUP-GUIDE.md)** - Complete setup instructions
- **[SECURITY-REVIEW.md](SECURITY-REVIEW.md)** - Security audit
- **[README.md](README.md)** - Project overview
- **[PLAN.md](PLAN.md)** - Architecture & roadmap

---

**Pro Tip**: Bookmark this page and http://localhost:8000/docs for quick access during development!
