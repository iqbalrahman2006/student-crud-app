# MySQL 8.0 Community Server Installation Script for Windows
# Run as Administrator
# Usage: powershell -ExecutionPolicy Bypass -File setup-mysql.ps1

Write-Host ""
Write-Host "=============================================================="
Write-Host "MySQL 8.0 Community Server Setup for studentDB"
Write-Host "=============================================================="
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges."
    Write-Host "Please run PowerShell as Administrator and retry."
    exit 1
}

Write-Host "OK: Running as Administrator"
Write-Host ""

# Step 1: Download MySQL Installer
Write-Host "[1/5] Downloading MySQL 8.0 Installer..."
$downloadUrl = "https://dev.mysql.com/get/mysql-installer-web-community-8.0.36.0.msi"
$installerPath = "$env:TEMP\mysql-installer.msi"

if (Test-Path $installerPath) {
    Write-Host "  Installer already downloaded at $installerPath"
}
else {
    Write-Host "  Downloading from: $downloadUrl"
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing -TimeoutSec 300
        Write-Host "  Downloaded: $installerPath"
    }
    catch {
        Write-Host "  ERROR: Download failed: $_"
        Write-Host "  Manual download: https://dev.mysql.com/downloads/installer/"
        exit 1
    }
}

Write-Host ""
Write-Host "[2/5] Starting MySQL Installer..."
Write-Host "  Please follow the installer prompts:"
Write-Host "  - Choose Developer Default or Server only"
Write-Host "  - Set root password (or leave blank for dev)"
Write-Host "  - Configure as Windows Service"
Write-Host "  - Keep default port 3306"
Write-Host ""

# Step 2: Launch installer
try {
    Start-Process -FilePath $installerPath -Wait -NoNewWindow
    Write-Host "OK: Installer completed"
}
catch {
    Write-Host "ERROR: Installer failed: $_"
    exit 1
}

Write-Host ""
Write-Host "[3/5] Verifying MySQL Service..."

# Step 3: Check if MySQL service is running
$service = Get-Service -Name "MySQL80" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "  OK: MySQL80 service is RUNNING"
    }
    else {
        Write-Host "  Starting MySQL80 service..."
        Start-Service -Name "MySQL80" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        $service = Get-Service -Name "MySQL80" -ErrorAction SilentlyContinue
        if ($service.Status -eq "Running") {
            Write-Host "  OK: MySQL80 service started"
        }
        else {
            Write-Host "  ERROR: Failed to start MySQL80 service"
            exit 1
        }
    }
}
else {
    Write-Host "  ERROR: MySQL80 service not found"
    exit 1
}

Write-Host ""
Write-Host "[4/5] Testing Node.js MySQL Connectivity..."

$nodeTestCode = 'require("dotenv").config(); const mysql = require("mysql2/promise"); (async function() { try { console.log("Testing..."); const c = await mysql.createConnection({host: "127.0.0.1", user: "root", password: "", database: "mysql"}); await c.end(); console.log("OK"); } catch (e) { console.error("ERROR:", e.message); process.exit(1); } })();'
$testScriptPath = "$env:TEMP\test-mysql.js"
Set-Content -Path $testScriptPath -Value $nodeTestCode -Encoding UTF8

try {
    Push-Location "d:\DBMS\studentDB\student-crud-app-1\server"
    node $testScriptPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: Node.js MySQL connection verified"
    }
    else {
        Write-Host "  WARNING: Connection test failed"
    }
    Pop-Location
}
catch {
    Write-Host "  WARNING: Could not test Node.js connection: $_"
}

Write-Host ""
Write-Host "[5/5] Creating Database and User..."

Write-Host "  Creating 'studentdb' database..."
$mysqlPath = (Get-Command mysql -ErrorAction SilentlyContinue).Source
if ($mysqlPath) {
    Write-Host "  Found mysql.exe at: $mysqlPath"
}
else {
    Write-Host "  mysql.exe not in PATH"
}

Write-Host ""
Write-Host "=============================================================="
Write-Host "Setup Complete!"
Write-Host "=============================================================="
Write-Host ""
Write-Host "OK: MySQL 8.0 is installed and running"
Write-Host ""
Write-Host "NEXT STEPS:"
Write-Host ""
Write-Host "1. Create database and user (via MySQL Command Line or Workbench):"
Write-Host ""
Write-Host "   CREATE DATABASE IF NOT EXISTS studentdb CHARACTER SET utf8mb4;"
Write-Host "   CREATE USER IF NOT EXISTS 'studentdb_user'@'localhost' IDENTIFIED BY 'studentdb_password';"
Write-Host "   GRANT ALL PRIVILEGES ON studentdb.* TO 'studentdb_user'@'localhost';"
Write-Host "   FLUSH PRIVILEGES;"
Write-Host ""
Write-Host "2. Update server/.env with:"
Write-Host ""
Write-Host "   DB_ENGINE=mysql"
Write-Host "   MYSQL_HOST=127.0.0.1"
Write-Host "   MYSQL_PORT=3306"
Write-Host "   MYSQL_USER=studentdb_user"
Write-Host "   MYSQL_PASSWORD=studentdb_password"
Write-Host "   MYSQL_DATABASE=studentdb"
Write-Host ""
Write-Host "3. Apply schema:"
Write-Host "   mysql -u studentdb_user -p studentdb < server/scripts/create-mysql-schema.sql"
Write-Host ""
Write-Host "4. Run migration dry-run:"
Write-Host "   cd server && node scripts/migrate-mongo-to-mysql.js"
Write-Host ""
Write-Host "See: d:\DBMS\studentDB\student-crud-app-1\migration\EXECUTION_GUIDE.md"
Write-Host ""
