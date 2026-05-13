# CoinVault

A cloud-native, mobile-first multilingual web application for managing and showcasing personal collections of coins and banknotes.

[![Phase](https://img.shields.io/badge/Phase-1%20Foundation-blue)](PLAN.md)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%2B%20FastAPI-green)](PLAN.md)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20Arabic-orange)](PLAN.md)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.9 or newer
- **Python** 3.12 or newer
- **Docker** (or compatible container runtime for Supabase)
- **Supabase CLI** (install: `npm install -g supabase`)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd CoinVault
```

### 2. Configure Environment

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your local configuration
# For Phase 1, use the local Supabase defaults
```

### 3. Start Local Supabase Services

```bash
# Start local PostgreSQL, Auth, and Storage
supabase start

# Note the output - you'll need the anon key and service_role key
# Update your .env file with these values
```

### 4. Start Backend (FastAPI)

```bash
cd backend

# Install dependencies
pip install -e ".[dev]"

# Start the development server
python -m uvicorn coinvault.main:app --app-dir src --reload

# Backend will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 5. Start Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# Frontend will be available at http://localhost:3000
```

### 6. Verify Setup

Visit the following URLs:

- **Public Page (English)**: http://localhost:3000/en
- **Public Page (Arabic)**: http://localhost:3000/ar
- **Admin Page**: http://localhost:3000/en/admin
- **Health Check**: http://localhost:3000/en/health
- **API Health**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

All services should show as healthy if setup is correct.

## 📚 Project Structure

```
CoinVault/
├── backend/              # FastAPI backend service
│   ├── src/
│   │   └── coinvault/
│   │       ├── api/      # API route handlers
│   │       ├── core/     # Configuration and settings
│   │       ├── services/ # Business logic and health checks
│   │       └── main.py   # Application entry point
│   └── tests/            # Backend tests (unit + integration)
│
├── frontend/             # Next.js frontend application
│   ├── app/              # App router pages
│   │   └── [locale]/     # Locale-aware routing (en, ar)
│   ├── src/              # Components, utilities, i18n
│   └── tests/            # Frontend tests (unit + UI)
│
├── supabase/             # Local Supabase configuration
│   ├── config.toml       # Supabase settings
│   └── migrations/       # Database migrations
│
├── specs/                # Feature specifications
│   └── 001-project-foundation/
│       ├── spec.md       # Feature specification
│       ├── plan.md       # Implementation plan
│       ├── tasks.md      # Task breakdown
│       └── quickstart.md # Detailed setup guide
│
├── docs/                 # Additional documentation
├── scripts/              # Automation scripts
├── .specify/             # SpecKit configuration
├── PLAN.md               # Overall project plan
└── CLAUDE.md             # AI assistant instructions

```

## 🛠️ Development Commands

### Backend

```bash
cd backend

# Run tests
pytest

# Type checking
mypy src

# Linting and formatting
ruff check src
ruff format src

# Run all checks
pytest && mypy src && ruff check src
```

### Frontend

```bash
cd frontend

# Run unit tests
npm test

# Run UI tests
npm run test:ui

# Type checking
npm run typecheck

# Linting
npm run lint

# Run all checks
npm run check
```

## 🌍 Multilingual Support

CoinVault supports:

- **English** (default): `/en/*`
- **Arabic** (RTL): `/ar/*`

All user-facing screens are fully localized with proper RTL layout support for Arabic.

## 📖 Documentation

- **[PLAN.md](PLAN.md)**: Complete project overview and architecture
- **[Quickstart Guide](specs/001-project-foundation/quickstart.md)**: Detailed setup instructions
- **[Phase 1 Specification](specs/001-project-foundation/spec.md)**: Foundation feature spec
- **[Constitution](.specify/memory/constitution.md)**: Project principles and standards
- **[AGENTS.md](AGENTS.md)**: AI assistant context

## 🏗️ Current Phase: Phase 1 - Project Foundation

**Status**: ✅ Complete

**Scope**:
- ✅ Next.js frontend with locale-aware routing
- ✅ FastAPI backend with health monitoring
- ✅ Local Supabase services (PostgreSQL, Auth, Storage)
- ✅ Environment configuration
- ✅ Testing infrastructure
- ✅ Development workflow automation

**Next Phase**: Phase 2 - Authentication & Authorization

See [PLAN.md](PLAN.md) for the complete roadmap.

## 🧪 Testing

The project follows a comprehensive testing strategy per the [Constitution](.specify/memory/constitution.md):

- **Unit Tests**: Every production function
- **Integration Tests**: Cross-boundary behavior
- **UI Tests**: User-facing flows in both English and Arabic RTL

Run all tests before committing:

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm run check
```

## 🔐 Security

- ✅ Secrets are never committed (use `.env`, never `.env.example` with real values)
- ✅ CORS configured for local development only
- ✅ Supabase service role key is privileged - never expose to frontend
- ✅ All configuration validated at startup

## 🚢 Deployment

**Phase 1**: Local development only

Cloud deployment setup is planned for a future phase. See [PLAN.md](PLAN.md) for roadmap.

## 🤝 Development Workflow

This project uses **Spec-Driven Development** with [SpecKit](https://github.com/specify-project/specify):

1. `/specify` - Create feature specification
2. `/clarify` - Clarify requirements
3. `/plan` - Generate implementation plan
4. `/tasks` - Generate task breakdown
5. Implementation - Build the feature
6. `/analyze` - Validate against specification

Each major feature follows this workflow. See [Constitution](.specify/memory/constitution.md) for details.

## 📋 Core Principles

Per the project [Constitution](.specify/memory/constitution.md):

1. **Clean Code by Default**: Simple, readable, intentional
2. **Tested Behavior for Every Function**: 100% production function coverage
3. **Minimalist, Modern UX**: Focused, accessible, consistent
4. **Mobile-First Responsive Design**: Validated from 360px up
5. **Cloud-Native, Documented Operation**: Deployable, observable, documented
6. **Multilingual and RTL Support**: English default, Arabic fully supported

## 🗺️ Roadmap

- ✅ **Phase 1**: Project Foundation (current)
- 🔄 **Phase 2**: Authentication & Authorization (next)
- ⏳ **Phase 3**: Collection Data Model
- ⏳ **Phase 4**: Admin Dashboard
- ⏳ **Phase 5**: Public Gallery
- ⏳ **Phase 6**: Search & Filtering
- ⏳ **Phase 7**: Statistics & Visualization
- ⏳ **Phase 8**: Interactive World Map
- ⏳ **Phase 9**: Export Features
- ⏳ **Phase 10**: Newsletter System
- ⏳ **Phase 11**: Arabic Localization
- ⏳ **Phase 12**: Final Hardening & Optimization

See [PLAN.md](PLAN.md) for complete phase details.

## 🐛 Troubleshooting

### Health check shows services unavailable

```bash
# Ensure Supabase is running
supabase status

# If not running, start it
supabase start

# Check your .env file has the correct SUPABASE_* values
```

### Backend won't start

```bash
# Ensure Python 3.12 is being used
python --version

# Reinstall dependencies
cd backend
pip install -e ".[dev]"
```

### Frontend won't start

```bash
# Clear Next.js cache
cd frontend
rm -rf .next

# Reinstall dependencies
npm install

# Try again
npm run dev
```

### CORS errors in browser

Ensure your `.env` has:
```
CORS_ORIGINS=http://localhost:3000
```

And restart the backend.

## 📞 Support

For questions or issues:

1. Check [specs/001-project-foundation/quickstart.md](specs/001-project-foundation/quickstart.md)
2. Review [PLAN.md](PLAN.md) for architecture details
3. See [Constitution](.specify/memory/constitution.md) for development standards

## 📄 License

[Add license information]

---

**Built with**: Next.js • FastAPI • PostgreSQL • Supabase • TypeScript • Python • Tailwind CSS

**Powered by**: Spec-Driven Development with SpecKit
