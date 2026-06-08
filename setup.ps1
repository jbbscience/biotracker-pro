# BioTracker Pro Setup Script
# Run this once to install Node.js and project dependencies

Write-Host "=== BioTracker Pro Setup ===" -ForegroundColor Cyan

# Check if Node.js is installed
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    Write-Host "Node.js not found. Installing via winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements

    # Refresh PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

    Write-Host "Node.js installed. You may need to restart your terminal." -ForegroundColor Green
} else {
    $nodeVer = node --version
    Write-Host "Node.js already installed: $nodeVer" -ForegroundColor Green
}

Write-Host "`nInstalling root dependencies..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
npm install

Write-Host "`nInstalling backend dependencies..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
npm install

Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
npm install

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Run: cd C:\claude-workspace\biotracker-pro && npm run dev" -ForegroundColor Cyan
Write-Host "Then open: http://localhost:5173" -ForegroundColor Cyan
