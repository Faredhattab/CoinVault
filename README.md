# CoinVault

A cloud-native, mobile-first multilingual web application for managing and showcasing personal collections of coins and banknotes.

[![Phase](https://img.shields.io/badge/Phase-2%20Auth%20%26%20Authz-blue)](PLAN.md)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%2B%20FastAPI-green)](PLAN.md)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20Arabic-orange)](PLAN.md)

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

**Verify**: [localhost:3000/en](http://localhost:3000/en) | [localhost:8000/health](http://localhost:8000/health)

---

## 📖 Documentation

**Essential:**
- **[QUICKREF.md](QUICKREF.md)**: One-page cheatsheet (⭐ start here)
- **[SETUP-GUIDE.md](SETUP-GUIDE.md)**: Complete setup & troubleshooting
- **[FINAL-REVIEW.md](FINAL-REVIEW.md)**: Grade A- (92/100) - Production ready!

**For Developers:**
- **[MANUAL-TASKS.md](MANUAL-TASKS.md)**: Tasks before Phase 5 (6-10 hours)
- **[SECURITY-REVIEW.md](SECURITY-REVIEW.md)**: 475-line security audit
- **[PLAN.md](PLAN.md)**: Architecture & roadmap

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript, next-intl.
- **Backend**: FastAPI, Python 3.12, Pydantic, slowapi.
- **Database**: PostgreSQL (Supabase), Row-Level Security (RLS).
- **Workflow**: Spec-Driven Development with SpecKit.

## 🌍 Localization

Fully supports **English (LTR)** and **Arabic (RTL)** with locale-aware routing and layout.

## 🔐 Security

- Backend-authoritative authentication & session management.
- Multi-layer RBAC (Role-Based Access Control).
- Comprehensive audit logging and rate limiting.

---

**Built with**: Next.js • FastAPI • PostgreSQL • Supabase • TypeScript • Python • Tailwind CSS
