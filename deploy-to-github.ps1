# Deploy WebBLE folder to GitHub Pages
# Usage: .\deploy-to-github.ps1 [commit-message]

param(
    [string]$CommitMessage = "Update webble deployment"
)

Write-Host "=== WebBLE GitHub Pages Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the webble directory
if (-not (Test-Path "index.html")) {
    Write-Host "Error: Must run from webble directory" -ForegroundColor Red
    exit 1
}

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
    
    Write-Host "Setting remote to christo-steyn/webble..." -ForegroundColor Yellow
    git remote add origin https://github.com/christo-steyn/webble.git
}

# Verify remote
$remote = git remote get-url origin 2>$null
if ($remote -ne "https://github.com/christo-steyn/webble.git") {
    Write-Host "Warning: Remote is '$remote'" -ForegroundColor Yellow
    Write-Host "Expected: https://github.com/christo-steyn/webble.git" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Generate firmware manifest if firmware exists
if (Test-Path "firmware") {
    Write-Host ""
    $generate = Read-Host "Regenerate firmware manifest? This will overwrite existing manifest.json (y/n)"
    if ($generate -eq "y") {
        Write-Host "Generating firmware manifest..." -ForegroundColor Yellow
        python generate_firmware_manifest.py
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Manifest generated successfully" -ForegroundColor Green
        } else {
            Write-Host "Warning: Manifest generation failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Skipping manifest generation" -ForegroundColor Yellow
    }
}

# Stage all files
Write-Host "Staging files..." -ForegroundColor Yellow
git add -A

# Show status
Write-Host ""
Write-Host "Files to commit:" -ForegroundColor Cyan
git status --short

# Commit
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "$CommitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Push
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Deployment Successful! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your site will be available at:" -ForegroundColor Cyan
    Write-Host "https://christo-steyn.github.io/webble/" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: GitHub Pages may take 1-2 minutes to update" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "=== Deployment Failed ===" -ForegroundColor Red
    Write-Host "Check the errors above" -ForegroundColor Yellow
    exit 1
}
