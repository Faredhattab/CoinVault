$ErrorActionPreference = "Stop"

function Pass($name) {
  Write-Host "[PASS] $name"
}

function Fail($name, $message) {
  Write-Error "[FAIL] $name - $message"
}

$root = Split-Path -Parent $PSScriptRoot

$requiredFiles = @(
  "docs/local-foundation.md",
  "specs/001-project-foundation/quickstart.md",
  "specs/001-project-foundation/contracts/health.openapi.yaml",
  ".env.example",
  "frontend/package.json",
  "backend/pyproject.toml"
)

foreach ($file in $requiredFiles) {
  $path = Join-Path $root $file
  if (!(Test-Path $path)) {
    Fail "Documentation" "Missing required file: $file"
  }
}
Pass "Documentation"

$contract = Get-Content (Join-Path $root "specs/001-project-foundation/contracts/health.openapi.yaml") -Raw
foreach ($needle in @("/health", "HealthResponse", "ServiceHealth", "ok", "degraded", "unavailable")) {
  if ($contract -notmatch [regex]::Escape($needle)) {
    Fail "Health contract" "Missing contract token: $needle"
  }
}
Pass "Health contract"

$envExample = Get-Content (Join-Path $root ".env.example") -Raw
foreach ($secretPattern in @("eyJ", "sk_", "password123", "service_role_secret")) {
  if ($envExample -match $secretPattern) {
    Fail "Secret hygiene" "Potential real secret pattern found in .env.example"
  }
}
Pass "Secret hygiene"

python -m compileall (Join-Path $root "backend/src") | Out-Null
Pass "Backend syntax"

$package = Get-Content (Join-Path $root "frontend/package.json") -Raw | ConvertFrom-Json
foreach ($script in @("build", "lint", "typecheck", "test", "test:ui")) {
  if (-not $package.scripts.$script) {
    Fail "Frontend package" "Missing npm script: $script"
  }
}
Pass "Frontend package"

Write-Host "Manual release validation completed."
