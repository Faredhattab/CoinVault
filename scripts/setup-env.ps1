# Setup Environment Script
# This script helps configure your .env file with Supabase keys

Write-Host "CoinVault Environment Setup"
Write-Host ""

# Check if Supabase is running
Write-Host "Checking if Supabase is running..."
$supabaseRunning = docker ps --filter "name=supabase_db_coinvault" --format "{{.Names}}" 2>$null

if (-not $supabaseRunning) {
    Write-Host "Supabase is not running!"
    Write-Host ""
    Write-Host "Please start Supabase first:"
    Write-Host "  cd $PSScriptRoot\.."
    Write-Host "  supabase start"
    Write-Host ""
    exit 1
}

Write-Host "Supabase is running"
Write-Host ""

# Get Supabase status
Write-Host "Getting Supabase configuration..."
Push-Location (Join-Path $PSScriptRoot "..")
$status = npx supabase status 2>&1 | Out-String

# Parse the publishable and secret keys using regex that matches the box drawing character
$publishableKey = ""
$secretKey = ""

# Match pattern: "Publishable │ <key>"
if ($status -match "Publishable\s+│\s+([^\s]+)") {
    $publishableKey = $matches[1]
}

# Match pattern: "Secret │ <key>"
if ($status -match "Secret\s+│\s+([^\s]+)") {
    $secretKey = $matches[1]
}

Pop-Location

if (-not $publishableKey -or -not $secretKey) {
    Write-Host "Could not parse Supabase keys from status output"
    Write-Host ""
    Write-Host "Please run manually:"
    Write-Host "  supabase status"
    Write-Host ""
    Write-Host "Then copy the Publishable and Secret keys to your .env file:"
    Write-Host "  SUPABASE_ANON_KEY=<Publishable key>"
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=<Secret key>"
    Write-Host ""
    exit 1
}

Write-Host "Found Supabase keys"
Write-Host ""

# Check if .env exists
$envPath = Join-Path $PSScriptRoot ".." ".env"
$envExamplePath = Join-Path $PSScriptRoot ".." ".env.example"

if (-not (Test-Path $envPath)) {
    Write-Host "Creating .env file from .env.example..."
    Copy-Item $envExamplePath $envPath
    Write-Host "Created .env file"
    Write-Host ""
}

# Read current .env content
$envContent = Get-Content $envPath -Raw

# Update the keys
$envContent = $envContent -replace "SUPABASE_ANON_KEY=.*", "SUPABASE_ANON_KEY=$publishableKey"
$envContent = $envContent -replace "SUPABASE_SERVICE_ROLE_KEY=.*", "SUPABASE_SERVICE_ROLE_KEY=$secretKey"

# Write back to .env
Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host "Updated .env file with Supabase keys"
Write-Host ""
Write-Host "Current configuration:"
Write-Host "  SUPABASE_URL: http://127.0.0.1:54321"
Write-Host "  SUPABASE_ANON_KEY: $publishableKey"
Write-Host "  SUPABASE_SERVICE_ROLE_KEY: $secretKey"
Write-Host ""
Write-Host "Environment setup complete!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Install python-dotenv: cd backend && pip install -e ."
Write-Host "  2. Restart your backend if it is already running"
Write-Host "  3. Start backend: cd backend && python -m uvicorn coinvault.main:app --app-dir src --reload"
Write-Host "  4. Start frontend: cd frontend && npm run dev"
Write-Host "  5. Visit: http://localhost:8000/health"
Write-Host ""
