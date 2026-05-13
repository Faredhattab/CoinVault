# CoinVault Setup Guide

Complete setup instructions for running CoinVault locally.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Setup](#2-quick-setup)
3. [Running Tests](#3-running-tests)
4. [Troubleshooting](#4-troubleshooting)
5. [Daily Workflows](#5-daily-workflows)

## 1. Prerequisites

Ensure these are installed before proceeding:

| Tool | Version | Check Command | Install |
|------|---------|---------------|---------|
| **Node.js** | 20.9+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.12+ | `python --version` | [python.org](https://www.python.org/) ⚠️ Check "Add to PATH" |
| **Docker Desktop** | Latest | `docker --version` | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | Any | `git --version` | Usually pre-installed |

**Supabase CLI** (install after Node.js):
```bash
npm install -g supabase
supabase --version
```

## 2. Quick Setup

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/Faredhattab/CoinVault.git
cd CoinVault

# Install backend dependencies
cd backend
pip install -e ".[dev]"
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Start Supabase

**⚠️ Ensure Docker Desktop is running first!**

```bash
# Start Supabase (downloads images on first run)
supabase start

# Save the output - you'll need:
# - anon key
# - service_role key
```

**Expected output:**
```
API URL: http://localhost:54321
Studio URL: http://localhost:54323
anon key: eyJhbGci...
service_role key: eyJhbGci...
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and paste the keys from Step 2
# Update these lines:
SUPABASE_ANON_KEY=<paste-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>
```

### Step 4: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn coinvault.main:app --app-dir src --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Verify

Visit these URLs:
- Frontend: [http://localhost:3000/en](http://localhost:3000/en)
- Backend Health: [http://localhost:8000/health](http://localhost:8000/health)
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Supabase Studio: [http://localhost:54323](http://localhost:54323)

## 3. Running Tests

### Backend Tests
```bash
cd backend

# All tests
pytest

# With coverage
pytest --cov=coinvault

# Type checking
mypy src

# Linting
ruff check src

# All checks
pytest && mypy src && ruff check src
```

### Frontend Tests
```bash
cd frontend

# Unit tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# UI tests (requires frontend server running)
npx playwright install  # First time only
npm run test:ui

# All checks
npm run check
```

## 4. Troubleshooting

### Supabase Issues

| Problem | Solution |
|---------|----------|
| Docker not running | Start Docker Desktop, wait for "running" status |
| Port 54321 in use | Run `supabase status` - if running, continue; else `supabase stop && supabase start` |
| Image download fails | Check internet; manually: `docker pull supabase/postgres:latest` |

### Backend Issues

| Problem | Solution |
|---------|----------|
| ModuleNotFoundError | `cd backend && pip install -e ".[dev]"` |
| Port 8000 in use | Use different port: `--port 8001`, update `.env` |
| Services unavailable | Check `.env` has correct keys, verify `supabase status`, restart Supabase |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| npm not found | Verify Node.js: `node --version`, reinstall if needed |
| Cannot find 'next' | `cd frontend && rm -rf node_modules package-lock.json && npm install` |
| Port 3000 in use | `npm run dev -- -p 3001` or kill process on 3000 |
| Can't connect to backend | Verify backend running at `localhost:8000/health`, check `.env` |

### Test Issues

| Problem | Solution |
|---------|----------|
| Backend tests fail | Ensure Supabase running: `supabase status`, reset: `supabase db reset` |
| UI tests fail | Ensure frontend running, install browsers: `npx playwright install` |

## 5. Daily Workflows

### Startup Routine
```bash
# 1. Start Docker Desktop (if not running)

# 2. Start all services
cd c:\Users\fared\CoinVault
supabase start

# Terminal 1 - Backend
cd backend
python -m uvicorn coinvault.main:app --app-dir src --reload

# Terminal 2 - Frontend
cd frontend
npm run dev

# Open: http://localhost:3000/en
```

### Before Committing
```bash
# Backend checks
cd backend && pytest && mypy src && ruff check src

# Frontend checks
cd frontend && npm run check

# Commit
git add .
git commit -m "your message"
```

### After Pulling Updates
```bash
# Update dependencies
cd backend && pip install -e ".[dev]"
cd ../frontend && npm install

# Reset database for new migrations
supabase db reset
```

### Stopping Services
```bash
# Stop frontend/backend: Ctrl+C in terminals

# Stop Supabase (keeps data)
supabase stop

# Stop Supabase (delete data)
supabase stop --no-backup
```

## Quick Reference

### Key Commands
```bash
supabase start              # Start Supabase
supabase status             # Check status
supabase stop               # Stop Supabase
python -m uvicorn ...       # Start backend
npm run dev                 # Start frontend
pytest                      # Backend tests
npm test                    # Frontend tests
```

### Important URLs
- Frontend: http://localhost:3000/en
- Backend: http://localhost:8000/health
- API Docs: http://localhost:8000/docs
- Supabase Studio: http://localhost:54323

### Port Map
| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8000 | http://localhost:8000 |
| Supabase API | 54321 | http://localhost:54321 |
| PostgreSQL | 54322 | - |
| Studio | 54323 | http://localhost:54323 |

---

**Need more help?** See [README.md](README.md) • [PLAN.md](PLAN.md) • [API Docs](http://localhost:8000/docs)
