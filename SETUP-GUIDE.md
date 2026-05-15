# CoinVault Setup Guide

## 1. Prerequisites

- **Node.js** 20.9+
- **Python** 3.12+
- **Docker Desktop**
- **Supabase CLI**: `npm install -g supabase`

## 2. Installation & Startup

```bash
# 1. Clone & Install
git clone https://github.com/Faredhattab/CoinVault.git
cd CoinVault

# 2. Start Supabase (Ensure Docker is running)
supabase start

# 3. Environment Setup
cp .env.example .env
# Copy 'anon key' and 'service_role key' from Supabase output to .env

# 4. Backend Setup
cd backend
pip install -e ".[dev]"
python -m coinvault.db.seeds.run_seeds
python -m uvicorn coinvault.main:app --app-dir src --reload

# 5. Frontend Setup (New Terminal)
cd frontend
npm install
npm run dev
```

## 3. Verification

- **Frontend**: [http://localhost:3000/en](http://localhost:3000/en)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Supabase Studio**: [http://localhost:54323](http://localhost:54323)

**Test Credentials**:
- **Email**: `admin@example.com`
- **Password**: `SecurePassword123!`

## 4. Testing

### Backend
```bash
cd backend
pytest && mypy src && ruff check src
```

### Frontend
```bash
cd frontend
npm run check
```

## 5. Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 54321 in use | `supabase stop && supabase start` |
| Port 8000 in use | Kill process or change port in uvicorn command |
| Backend Error: `ModuleNotFoundError` | Run `pip install -e ".[dev]"` from `backend/` |
| Database Connection Failed | Ensure Docker is running and `supabase status` shows all services up |

---

For more details, see **[QUICKREF.md](QUICKREF.md)** or **[SECURITY-REVIEW.md](SECURITY-REVIEW.md)**.
