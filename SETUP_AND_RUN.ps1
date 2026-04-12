# Hotel QR Ordering System - Full Auto Setup & Launch
# Run this script from Project Zero directory as Administrator if needed

$ErrorActionPreference = "Continue"
$PROJECT_ROOT  = Split-Path -Parent $MyInvocation.MyCommand.Path
$JAVA_HOME     = "C:\Program Files\Java\jdk-25.0.2"
$DOCKER_EXE    = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$NODE_DIR      = "C:\Program Files\nodejs"
$BACKEND_DIR   = "$PROJECT_ROOT\ProjectZero\ProjectZero"

# Pre-add Node to PATH
if (Test-Path "$NODE_DIR\node.exe") { $env:PATH = "$NODE_DIR;" + $env:PATH }

function Write-Step($n, $msg) {
    Write-Host ""
    Write-Host "[$n] $msg" -ForegroundColor Cyan
}

function Write-OK($msg)   { Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-WARN($msg) { Write-Host "    WARN: $msg" -ForegroundColor Yellow }
function Write-FAIL($msg) { Write-Host "    FAIL: $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  Hotel QR Ordering System - Auto Setup & Launch" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# ── STEP 1: Java ─────────────────────────────────────────────────────
Write-Step 1 "Configuring Java..."
$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;" + $env:PATH
$javaVer = & "$JAVA_HOME\bin\java.exe" -version 2>&1
Write-OK "Java found: $($javaVer[0])"

# ── STEP 2: Node.js ───────────────────────────────────────────────────
Write-Step 2 "Checking Node.js..."
$node = Get-Command node -ErrorAction SilentlyContinue

if (-not $node) {
    # Try common Windows install paths
    $nodePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:APPDATA\nvm\v*\node.exe"
    )
    foreach ($p in $nodePaths) {
        $found = Get-Item $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $env:PATH = (Split-Path $found.FullName) + ";" + $env:PATH
            $node = Get-Command node -ErrorAction SilentlyContinue
            break
        }
    }
}

if (-not $node) {
    Write-WARN "Node.js not found. Installing via winget..."
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements 2>&1
    # Refresh PATH from registry
    $machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    $userPath    = [Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH    = $machinePath + ";" + $userPath
    $node = Get-Command node -ErrorAction SilentlyContinue

    if (-not $node) {
        # Force add default nodejs install path
        $env:PATH = "C:\Program Files\nodejs;" + $env:PATH
        $node = Get-Command node -ErrorAction SilentlyContinue
    }
}

if ($node) {
    $nodeVer = node --version 2>&1
    Write-OK "Node.js: $nodeVer"
    $npmVer = npm --version 2>&1
    Write-OK "npm: $npmVer"
} else {
    Write-FAIL "Node.js could not be installed. Install from https://nodejs.org manually."
    Write-Host "  Press any key to continue with backend only..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# ── STEP 3: Docker Desktop ────────────────────────────────────────────
Write-Step 3 "Checking Docker..."
$dockerTest = & $DOCKER_EXE ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-WARN "Docker daemon not running. Starting Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "    Waiting 50 seconds for Docker to initialize..." -ForegroundColor Yellow
    $wait = 0
    while ($wait -lt 50) {
        Start-Sleep -Seconds 5
        $wait += 5
        $dockerTest = & $DOCKER_EXE ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-OK "Docker is ready!"
            break
        }
        Write-Host "    Still waiting... ($wait/50s)" -ForegroundColor DarkGray
    }
    if ($LASTEXITCODE -ne 0) {
        Write-FAIL "Docker did not start. Please start Docker Desktop manually and re-run."
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-OK "Docker is running"
}

# ── STEP 4: Start PostgreSQL containers ───────────────────────
Write-Step 4 "Starting PostgreSQL (Docker Compose)..."
Set-Location $PROJECT_ROOT
& $DOCKER_EXE compose up -d 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

Write-Host "    Waiting for database health checks..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 24; $i++) {
    Start-Sleep -Seconds 5
    $pgCheck    = & $DOCKER_EXE exec hotel_postgres pg_isready -U postgres -d hoteldb 2>&1
    if ($pgCheck -match "accepting connections") {
        $ready = $true
        break
    }
    Write-Host "    PostgreSQL: $pgCheck" -ForegroundColor DarkGray
}

if ($ready) {
    Write-OK "PostgreSQL is accepting connections"
} else {
    Write-WARN "Containers may still be starting. Continuing..."
}

# ── STEP 5: Start Spring Boot Backend ────────────────────────────────
Write-Step 5 "Starting Spring Boot backend on :8080..."
# Kill any process already on 8080
$port8080 = netstat -ano 2>$null | Select-String ":8080 " | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1
if ($port8080 -and $port8080 -match '^\d+$') {
    Write-WARN "Port 8080 in use by PID $port8080. Stopping it..."
    Stop-Process -Id $port8080 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-OK "Port 8080 cleared"
}
$javaHomeEsc = $JAVA_HOME
$backendScript = @"
`$env:JAVA_HOME = '$javaHomeEsc'
`$env:PATH = '$javaHomeEsc\bin;' + `$env:PATH
Set-Location '$BACKEND_DIR'
Write-Host 'Building and starting backend...' -ForegroundColor Cyan
.\gradlew.bat bootRun
"@
$backendScriptPath = "$PROJECT_ROOT\start-backend.ps1"
$backendScript | Out-File -FilePath $backendScriptPath -Encoding UTF8

Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $backendScriptPath -WindowStyle Normal
Write-OK "Backend process launched. Waiting 35 seconds for startup..."
Start-Sleep -Seconds 35

# ── STEP 6: Start Frontend Apps ───────────────────────────────────────
if ($node) {
    $apps = @(
        @{ Name = "customer-app"; Port = 3000 },
        @{ Name = "kitchen-app";  Port = 3001 },
        @{ Name = "admin-app";    Port = 3002 }
    )

    foreach ($app in $apps) {
        Write-Step "6.$($apps.IndexOf($app)+1)" "Starting $($app.Name) on :$($app.Port)..."
        $appPath = "$PROJECT_ROOT\$($app.Name)"
        $appScript = @"
Set-Location '$appPath'
Write-Host 'Installing $($app.Name) dependencies...' -ForegroundColor Cyan
npm install
Write-Host 'Starting $($app.Name) on port $($app.Port)...' -ForegroundColor Green
npm run dev
"@
        $scriptPath = "$PROJECT_ROOT\start-$($app.Name).ps1"
        $appScript | Out-File -FilePath $scriptPath -Encoding UTF8
        Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $scriptPath -WindowStyle Normal
        Start-Sleep -Seconds 3
        Write-OK "$($app.Name) started"
    }

    # ── STEP 7: Open Browsers ─────────────────────────────────────────
    Write-Step 7 "Opening browsers in 20 seconds..."
    Start-Sleep -Seconds 20

    Start-Process "http://localhost:3002"
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:3000?hotelId=1&tableNo=1"
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:3001"
}

# ── Done ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  ALL SERVICES LAUNCHED!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  Customer Menu : http://localhost:3000?hotelId=1&tableNo=1" -ForegroundColor White
Write-Host "  Kitchen KDS   : http://localhost:3001" -ForegroundColor White
Write-Host "  Admin Panel   : http://localhost:3002   [admin / admin123]" -ForegroundColor White
Write-Host "  Backend API   : http://localhost:8080" -ForegroundColor White
Write-Host "  PostgreSQL    : localhost:5432 / hoteldb" -ForegroundColor White

Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""
Read-Host "Press Enter to close this window (services keep running)"
