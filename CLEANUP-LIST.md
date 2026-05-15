# Cleanup List - CoinVault Project

## ✅ Safe to Delete (Will be cleaned now)

### 1. Test Artifacts
- `frontend/test-results/` - Playwright test output (auto-regenerated)
- `frontend/.last-run.json` - Test metadata

### 2. Python Build Artifacts  
- `backend/build/` - Python package build artifacts (72KB)
- `backend/.pytest_cache/` - Pytest cache (9KB)
- `backend/.mypy_cache/` - MyPy type checker cache (20MB)
- `.mypy_cache/` - Root mypy cache (7.3MB)
- `.ruff_cache/` - Ruff linter cache (2KB)

### 3. Temporary/Test Files (Root)
- `test_endpoint.py` - Debug script (2.5KB)
- `test_login.py` - Test script (649B)
- `backend.log` - Old backend log (351B)

### 4. Obsolete Backend Migrations
- `backend/migrations/` - Old migration folder (superseded by supabase/migrations/)

**Total Space**: ~27.5 MB

## ✅ Already Removed
- `FINAL-REVIEW.md` (consolidated into README.md)
- `MANUAL-TASKS.md` (consolidated into SETUP-GUIDE.md)
- `PLAYWRIGHT-TROUBLESHOOTING.md` (consolidated into SETUP-GUIDE.md)
- `QUICKREF.md` (consolidated into SETUP-GUIDE.md)

## ⚠️ Keep (Important)

### Supabase Migrations (VERIFIED GOOD ✅)
- `supabase/migrations/00000000000000_foundation.sql`
- `supabase/migrations/20260514204335_admin_auth.sql`  
- `supabase/migrations/20260515012424_fix_recursive_policies.sql`

**Status**: All migrations tested and apply cleanly ✅

### Documentation
- `README.md` - Project overview
- `SETUP-GUIDE.md` - Complete developer guide  
- `PLAN.md` - Architecture spec
- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` - AI configs

### Configuration
- `.env.example` - Template for environment variables
- `.gitignore` - Git ignore patterns (just updated)
- All `.env` files (not tracked by git)

### Source Code
- `backend/src/` - Backend application code
- `frontend/` - Frontend application code (except test-results)
- `shared/` - Shared types
- `supabase/` - Database schema & seeds

## 📊 Final Structure After Cleanup

```
CoinVault/
├── .gitignore (updated)
├── README.md
├── SETUP-GUIDE.md
├── PLAN.md
├── CLAUDE.md, AGENTS.md, GEMINI.md
├── .env.example
├── backend/
│   ├── src/coinvault/
│   ├── tests/
│   └── .env
├── frontend/
│   ├── app/
│   ├── src/
│   ├── tests/
│   └── .env.local
├── supabase/
│   ├── migrations/ (3 files - all good ✅)
│   └── seed.sql
└── shared/
    └── types/
```

**Total Files Removed**: 11 items  
**Space Reclaimed**: ~27.5 MB  
**Migrations Status**: ✅ Verified and working
