# CoinVault - Complete Setup & Run Guide

This guide provides detailed step-by-step instructions for setting up and running the CoinVault application from scratch.

## Table of Contents

1. [Prerequisites Installation](#1-prerequisites-installation)
2. [Understanding Supabase](#2-understanding-supabase)
3. [Installing Supabase CLI](#3-installing-supabase-cli)
4. [Project Setup](#4-project-setup)
5. [Starting Supabase Services](#5-starting-supabase-services)
6. [Configuring Environment](#6-configuring-environment)
7. [Starting the Backend](#7-starting-the-backend)
8. [Starting the Frontend](#8-starting-the-frontend)
9. [Running Tests](#9-running-tests)
10. [Verification](#10-verification)
11. [Stopping Services](#11-stopping-services)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites Installation

### 1.1 Node.js (Version 20.9 or newer)

**Check if installed:**
```bash
node --version
# Should show v20.9.0 or higher
```

**Install if needed:**
- **Windows**: Download from https://nodejs.org/ (choose LTS version)
- **After installation, verify:**
  ```bash
  node --version
  npm --version
  ```

### 1.2 Python (Version 3.12 or newer)

**Check if installed:**
```bash
python --version
# Should show Python 3.12.0 or higher
```

**Install if needed:**
- **Windows**: Download from https://www.python.org/downloads/
  - ✅ **IMPORTANT**: Check "Add Python to PATH" during installation
  - Choose "Install Now" or "Customize Installation"
  
**Verify pip is installed:**
```bash
pip --version
```

### 1.3 Docker Desktop (for Supabase local services)

**Check if installed:**
```bash
docker --version
docker-compose --version
```

**Install if needed:**
- **Windows**: Download Docker Desktop from https://www.docker.com/products/docker-desktop/
  - Install and restart your computer
  - Start Docker Desktop (ensure it's running in the system tray)
  - Docker must be running before starting Supabase

**Verify Docker is running:**
```bash
docker ps
# Should show an empty list or running containers (not an error)
```

### 1.4 Git (should already be installed)

**Verify:**
```bash
git --version
```

---

## 2. Understanding Supabase

### What is Supabase?

**Supabase** is an open-source Firebase alternative that provides:
- **PostgreSQL Database**: Industry-standard relational database
- **Authentication**: Built-in user authentication (email/password, OAuth, etc.)
- **Storage**: File storage service for images and documents
- **Realtime**: WebSocket-based real-time database updates
- **Auto-generated APIs**: REST and GraphQL APIs for your database

### Why We Use Supabase in CoinVault

1. **Database**: Store collection items, categories, users, and metadata
2. **Authentication**: Admin login with email/password and Google OAuth
3. **Storage**: Store coin and banknote images (front, back, gallery)
4. **Local Development**: Run everything locally without cloud dependencies

### Supabase Architecture in Our Project

```
┌─────────────────────────────────────────────────────┐
│                  CoinVault App                       │
├─────────────────┬───────────────┬───────────────────┤
│  Next.js        │  FastAPI      │  Supabase         │
│  Frontend       │  Backend      │  Services         │
│                 │               │                   │
│  Port: 3000     │  Port: 8000   │  Multiple Ports   │
└─────────────────┴───────────────┴───────────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │  Local Supabase Stack        │
          │  (Runs in Docker)            │
          ├──────────────────────────────┤
          │  - PostgreSQL  (Port 54322)  │
          │  - Auth        (Port 54321)  │
          │  - Storage     (Port 54321)  │
          │  - Studio      (Port 54323)  │ ← Web UI
          └──────────────────────────────┘
```

### Local vs Cloud Supabase

| Aspect | Local (Phase 1) | Cloud (Future) |
|--------|-----------------|----------------|
| **Database** | Runs on your computer | Hosted on Supabase servers |
| **Data** | Stored locally | Stored in cloud |
| **Access** | Only you (localhost) | Internet accessible |
| **Cost** | Free | Free tier, then paid |
| **Setup** | Supabase CLI | Supabase Dashboard |

**Phase 1 uses LOCAL Supabase only** - no cloud account needed yet!

---

## 3. Installing Supabase CLI

The **Supabase CLI** is a command-line tool that lets you run Supabase services locally.

### 3.1 Install via npm (Recommended for Windows)

```bash
# Install globally
npm install -g supabase

# Verify installation
supabase --version
# Should show: supabase 1.x.x
```

### 3.2 Alternative: Install via Scoop (Windows)

If you use Scoop package manager:
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 3.3 Verify Installation

```bash
supabase --version
supabase --help
```

---

## 4. Project Setup

### 4.1 Clone the Repository

```bash
# Clone the project
git clone https://github.com/Faredhattab/CoinVault.git

# Navigate to project directory
cd CoinVault

# Ensure you're on master branch
git checkout master
git pull origin master
```

### 4.2 Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -e ".[dev]"

# Verify installation
python -c "import fastapi; print('FastAPI installed successfully')"

# Go back to project root
cd ..
```

### 4.3 Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# This will take a few minutes...
# Verify installation
npm list next react
# Should show installed versions

# Go back to project root
cd ..
```

---

## 5. Starting Supabase Services

This is the **most important step** - everything depends on Supabase running!

### 5.1 Ensure Docker is Running

```bash
# Check Docker status
docker ps

# If you get an error, start Docker Desktop manually:
# - Open Docker Desktop from Start Menu
# - Wait until it shows "Docker Desktop is running"
```

### 5.2 Start Supabase

```bash
# Make sure you're in the project root (CoinVault/)
cd c:\Users\fared\CoinVault

# Start Supabase services
supabase start
```

**This command will:**
1. Download Docker images (first time only - takes 5-10 minutes)
2. Start PostgreSQL database
3. Start Auth service
4. Start Storage service
5. Start Supabase Studio (web UI)
6. Apply database migrations from `supabase/migrations/`

### 5.3 Expected Output

You should see output like this:

```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**📝 SAVE THESE VALUES!** You'll need them for environment configuration.

### 5.4 Verify Supabase is Running

```bash
# Check running containers
docker ps

# You should see containers named:
# - supabase_db_coinvault
# - supabase_auth_coinvault
# - supabase_storage_coinvault
# - supabase_studio_coinvault
# etc.
```

### 5.5 Access Supabase Studio (Web UI)

Open in your browser:
```
http://localhost:54323
```

**Supabase Studio** is a web interface where you can:
- View database tables
- Run SQL queries
- Manage users
- Browse storage buckets
- View logs

---

## 6. Configuring Environment

### 6.1 Create .env File

```bash
# Copy the example environment file
cp .env.example .env

# Open in your text editor
code .env
# or
notepad .env
```

### 6.2 Fill in Environment Variables

Open `.env` and update with the values from `supabase start` output:

```bash
# Frontend Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,ar

# Backend Configuration
APP_ENV=local
API_HOST=127.0.0.1
API_PORT=8000
CORS_ORIGINS=http://localhost:3000

# Supabase Configuration (UPDATE THESE!)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← Copy from supabase start output
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← Copy from supabase start output
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_STORAGE_URL=http://127.0.0.1:54321/storage/v1
```

**Important Notes:**
- `SUPABASE_ANON_KEY`: Used by the frontend (public)
- `SUPABASE_SERVICE_ROLE_KEY`: Used by the backend (private, full access)
- These keys are **local only** and different from production keys

### 6.3 Verify Configuration

```bash
# Check that .env exists and has content
cat .env
# or on Windows:
type .env
```

---

## 7. Starting the Backend

The backend is a **FastAPI** application that provides the REST API.

### 7.1 Open a New Terminal Window

**Important**: Keep Supabase running in its terminal. Open a **NEW** terminal window.

### 7.2 Navigate to Backend Directory

```bash
cd c:\Users\fared\CoinVault\backend
```

### 7.3 Activate Virtual Environment (Optional but Recommended)

```bash
# Create virtual environment (first time only)
python -m venv .venv

# Activate it
# On Windows:
.venv\Scripts\activate

# You should see (.venv) in your prompt
```

### 7.4 Start the Backend Server

```bash
# Start FastAPI with auto-reload
python -m uvicorn coinvault.main:app --app-dir src --reload --host 0.0.0.0 --port 8000
```

**Command explanation:**
- `uvicorn`: ASGI server for FastAPI
- `coinvault.main:app`: Module path to FastAPI app
- `--app-dir src`: Source code directory
- `--reload`: Auto-restart on code changes
- `--host 0.0.0.0`: Listen on all network interfaces
- `--port 8000`: Run on port 8000

### 7.5 Expected Output

```
INFO:     Will watch for changes in these directories: ['C:\\Users\\fared\\CoinVault\\backend\\src']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 7.6 Verify Backend is Running

Open in browser:
```
http://localhost:8000/health
```

You should see JSON response:
```json
{
  "status": "ok",
  "checked_at": "2026-05-13T21:00:00Z",
  "services": {
    "web": {
      "status": "ok",
      "message": "Frontend shell reachable"
    },
    "backend": {
      "status": "ok",
      "message": "Backend reachable"
    },
    "database": {
      "status": "ok",
      "message": "Connected to PostgreSQL"
    },
    "auth": {
      "status": "ok",
      "message": "Auth service reachable"
    },
    "storage": {
      "status": "ok",
      "message": "Storage service reachable"
    }
  }
}
```

### 7.7 View API Documentation

FastAPI automatically generates interactive API docs:

**Swagger UI:**
```
http://localhost:8000/docs
```

**ReDoc:**
```
http://localhost:8000/redoc
```

---

## 8. Starting the Frontend

The frontend is a **Next.js** application with React.

### 8.1 Open Another New Terminal Window

Keep backend and Supabase running. Open a **THIRD** terminal window.

### 8.2 Navigate to Frontend Directory

```bash
cd c:\Users\fared\CoinVault\frontend
```

### 8.3 Start the Development Server

```bash
# Start Next.js development server
npm run dev
```

**Alternative ports** (if 3000 is busy):
```bash
# Run on different port
npm run dev -- -p 3001
```

### 8.4 Expected Output

```
   ▲ Next.js 16.0.0
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Ready in 2.5s
 ○ Compiling / ...
 ✓ Compiled / in 1.2s
```

### 8.5 Verify Frontend is Running

Open in browser:
```
http://localhost:3000/en
```

You should see the **public placeholder page** with:
- "Phase 1 - Project Foundation" label
- "CoinVault Public Gallery" title
- Navigation links

**Test Arabic locale:**
```
http://localhost:3000/ar
```

Page should display in Arabic with **RTL (right-to-left)** layout.

### 8.6 Test Other Pages

**Admin placeholder:**
```
http://localhost:3000/en/admin
```

**Health check page:**
```
http://localhost:3000/en/health
```

This page shows the status of all services with detailed health information.

---

## 9. Running Tests

### 9.1 Backend Tests

Open a new terminal or stop the backend server (Ctrl+C), then:

```bash
cd c:\Users\fared\CoinVault\backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=coinvault --cov-report=term-missing

# Run specific test file
pytest tests/unit/test_config.py

# Run specific test function
pytest tests/unit/test_config.py::test_config_loads_from_env -v
```

**Expected output:**
```
======================== test session starts ========================
platform win32 -- Python 3.12.0, pytest-8.3.0, pluggy-1.5.0
collected 15 items

tests/unit/test_config.py .....                              [ 33%]
tests/unit/test_health_models.py ......                      [ 73%]
tests/integration/test_health_endpoint.py ....               [100%]

======================== 15 passed in 2.45s ========================
```

### 9.2 Backend Type Checking

```bash
cd backend

# Run mypy type checker
mypy src

# Should show: Success: no issues found
```

### 9.3 Backend Linting

```bash
cd backend

# Check code style
ruff check src

# Auto-fix issues
ruff check --fix src

# Format code
ruff format src
```

### 9.4 Frontend Unit Tests

```bash
cd c:\Users\fared\CoinVault\frontend

# Run unit tests (Vitest)
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### 9.5 Frontend Type Checking

```bash
cd frontend

# Run TypeScript compiler check
npm run typecheck

# Should complete with no errors
```

### 9.6 Frontend Linting

```bash
cd frontend

# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### 9.7 Frontend UI Tests (Playwright)

**Important**: Frontend server must be running for UI tests!

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run UI tests
npm run test:ui

# Run in headed mode (see browser)
npm run test:ui -- --headed

# Run specific test file
npx playwright test tests/health.spec.ts

# Open test report
npx playwright show-report
```

**Expected output:**
```
Running 6 tests using 1 worker

  ✓  tests/placeholders.en.spec.ts:3:5 › English public page loads (2.1s)
  ✓  tests/placeholders.en.spec.ts:8:5 › English admin page loads (1.8s)
  ✓  tests/placeholders.ar.spec.ts:3:5 › Arabic public page loads (1.9s)
  ✓  tests/placeholders.ar.spec.ts:8:5 › Arabic admin page loads (1.7s)
  ✓  tests/health.spec.ts:3:5 › Health page shows services (2.3s)
  ✓  tests/health.spec.ts:8:5 › Health page shows status (2.1s)

  6 passed (12.9s)
```

### 9.8 Run All Checks at Once

**Backend:**
```bash
cd backend
pytest && mypy src && ruff check src
```

**Frontend:**
```bash
cd frontend
npm run check
# This runs: typecheck + lint + test
```

---

## 10. Verification

### 10.1 Complete Verification Checklist

Run through this checklist to ensure everything works:

- [ ] **Supabase Status**
  ```bash
  supabase status
  ```
  All services show "Running"

- [ ] **Backend Health**
  - Visit: http://localhost:8000/health
  - All services show `"status": "ok"`

- [ ] **Backend API Docs**
  - Visit: http://localhost:8000/docs
  - Interactive API documentation loads

- [ ] **Frontend English**
  - Visit: http://localhost:3000/en
  - Public page loads correctly

- [ ] **Frontend Arabic**
  - Visit: http://localhost:3000/ar
  - RTL layout displays correctly

- [ ] **Frontend Admin**
  - Visit: http://localhost:3000/en/admin
  - Admin placeholder loads

- [ ] **Frontend Health**
  - Visit: http://localhost:3000/en/health
  - Service status list displays

- [ ] **Backend Tests**
  ```bash
  cd backend && pytest
  ```
  All tests pass

- [ ] **Frontend Tests**
  ```bash
  cd frontend && npm test
  ```
  All tests pass

- [ ] **Supabase Studio**
  - Visit: http://localhost:54323
  - Database UI loads

### 10.2 Test Complete User Flow

1. Open http://localhost:3000/en
2. Click "View Admin" → should navigate to `/en/admin`
3. Click "Check System Health" → should show health dashboard
4. Switch to Arabic: http://localhost:3000/ar
5. Verify layout is RTL (right-to-left)
6. Check that navigation works in Arabic

---

## 11. Stopping Services

### 11.1 Stop Frontend

In the frontend terminal:
```
Press Ctrl+C
```

### 11.2 Stop Backend

In the backend terminal:
```
Press Ctrl+C
```

### 11.3 Stop Supabase

**Option 1: Stop services (keep data)**
```bash
cd c:\Users\fared\CoinVault
supabase stop
```

**Option 2: Stop and reset (delete all data)**
```bash
supabase stop --no-backup
```

### 11.4 Verify Stopped

```bash
docker ps
# Should show no Supabase containers
```

### 11.5 Restart Later

To start everything again:
```bash
# Start Supabase
supabase start

# Start backend (in new terminal)
cd backend
python -m uvicorn coinvault.main:app --app-dir src --reload

# Start frontend (in another terminal)
cd frontend
npm run dev
```

---

## 12. Troubleshooting

### 12.1 Supabase Won't Start

**Problem**: `Error: Docker is not running`

**Solution:**
```bash
# Start Docker Desktop manually
# Wait until it shows "Docker Desktop is running"
# Then try again:
supabase start
```

---

**Problem**: `Error: port 54321 is already in use`

**Solution:**
```bash
# Check if Supabase is already running
supabase status

# If it shows running, just use it
# If not, stop conflicting services:
supabase stop
supabase start
```

---

**Problem**: `Error downloading Docker images`

**Solution:**
```bash
# Check internet connection
# Try pulling images manually:
docker pull supabase/postgres:latest
docker pull supabase/studio:latest

# Then try again:
supabase start
```

---

### 12.2 Backend Won't Start

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd backend
pip install -e ".[dev]"
```

---

**Problem**: `Address already in use: port 8000`

**Solution:**
```bash
# Use different port:
python -m uvicorn coinvault.main:app --app-dir src --reload --port 8001

# Update NEXT_PUBLIC_API_BASE_URL in .env:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

---

**Problem**: All services show `"status": "unavailable"`

**Solution:**
```bash
# 1. Check .env file exists and has correct Supabase URLs
cat .env

# 2. Verify Supabase is actually running
supabase status

# 3. Check Docker containers
docker ps

# 4. Restart Supabase
supabase stop
supabase start

# 5. Restart backend
```

---

### 12.3 Frontend Won't Start

**Problem**: `npm: command not found`

**Solution:**
```bash
# Check Node.js installation
node --version

# Reinstall Node.js if needed
# Then verify:
npm --version
```

---

**Problem**: `Error: Cannot find module 'next'`

**Solution:**
```bash
cd frontend
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

**Problem**: `Port 3000 is already in use`

**Solution:**
```bash
# Use different port:
npm run dev -- -p 3001

# Or kill the process using port 3000:
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

**Problem**: Pages show `Error: Cannot connect to backend`

**Solution:**
```bash
# 1. Verify backend is running
curl http://localhost:8000/health

# 2. Check NEXT_PUBLIC_API_BASE_URL in .env
cat .env | grep NEXT_PUBLIC_API_BASE_URL

# 3. Restart frontend after changing .env
npm run dev
```

---

### 12.4 Tests Failing

**Problem**: Backend tests fail with database errors

**Solution:**
```bash
# Ensure Supabase is running
supabase status

# Reset database if needed
supabase db reset

# Run tests again
pytest
```

---

**Problem**: Frontend UI tests fail

**Solution:**
```bash
# Ensure frontend is running
# Open http://localhost:3000/en first

# Install Playwright browsers
npx playwright install

# Run tests with visible browser to debug
npm run test:ui -- --headed --debug
```

---

**Problem**: Tests pass locally but fail in CI

**Solution:**
- Check that `.env.example` has all required variables
- Verify test doesn't depend on local machine state
- Check Docker availability in CI environment

---

### 12.5 Docker Issues

**Problem**: Docker Desktop won't start

**Solution:**
```bash
# Windows:
# 1. Restart Docker Desktop
# 2. Restart computer
# 3. Check Windows features:
#    - Hyper-V enabled
#    - WSL 2 installed
# 4. Update Docker Desktop to latest version
```

---

**Problem**: Docker containers keep restarting

**Solution:**
```bash
# Check container logs
docker logs supabase_db_coinvault

# Stop and remove all containers
supabase stop
docker system prune -a

# Start fresh
supabase start
```

---

## 13. Common Workflows

### 13.1 Daily Development Startup

```bash
# 1. Start Docker Desktop (if not running)

# 2. Start Supabase
cd c:\Users\fared\CoinVault
supabase start

# 3. Start backend (new terminal)
cd backend
python -m uvicorn coinvault.main:app --app-dir src --reload

# 4. Start frontend (new terminal)
cd frontend
npm run dev

# 5. Open browser
# http://localhost:3000/en
```

### 13.2 Before Committing Code

```bash
# Run all checks
cd backend
pytest && mypy src && ruff check src

cd ../frontend
npm run check

# If all pass, commit your code
git add .
git commit -m "your message"
```

### 13.3 After Pulling Latest Code

```bash
# Update dependencies
cd backend
pip install -e ".[dev]"

cd ../frontend
npm install

# Apply any new migrations
supabase db reset

# Restart services
```

---

## 14. Next Steps

Now that everything is running:

1. **Explore Supabase Studio**: http://localhost:54323
   - View database schema
   - Run SQL queries
   - Create test data

2. **Read API Documentation**: http://localhost:8000/docs
   - See available endpoints
   - Test API calls

3. **Check Project Plan**: Open `PLAN.md`
   - Phase 1: ✅ Complete
   - Phase 2: Authentication & Authorization (next)

4. **Start Phase 2 Development**:
   ```bash
   # Read Phase 2 details
   cat PLAN.md | grep -A 30 "Phase 2"
   ```

---

## 15. Quick Reference

### Essential Commands

```bash
# Supabase
supabase start        # Start local services
supabase status       # Check service status
supabase stop         # Stop services
supabase db reset     # Reset database

# Backend
cd backend
python -m uvicorn coinvault.main:app --app-dir src --reload
pytest                # Run tests
mypy src              # Type check
ruff check src        # Lint

# Frontend
cd frontend
npm run dev           # Start dev server
npm test              # Run tests
npm run typecheck     # Type check
npm run lint          # Lint
```

### Important URLs

```
Frontend:         http://localhost:3000/en
Backend API:      http://localhost:8000/health
API Docs:         http://localhost:8000/docs
Supabase Studio:  http://localhost:54323
```

### Port Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8000 | http://localhost:8000 |
| Supabase API | 54321 | http://localhost:54321 |
| PostgreSQL | 54322 | postgresql://localhost:54322 |
| Supabase Studio | 54323 | http://localhost:54323 |
| Inbucket (Email) | 54324 | http://localhost:54324 |

---

## Need Help?

- **README**: Main project overview
- **PLAN.md**: Complete project roadmap
- **API Docs**: http://localhost:8000/docs
- **Supabase Docs**: https://supabase.com/docs

**You're all set! Happy coding! 🚀**
