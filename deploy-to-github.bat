@echo off
REM Quick deploy to GitHub Pages
echo.
echo === WebBLE GitHub Pages Deployment ===
echo.

REM Check if in webble directory
if not exist "index.html" (
    echo Error: Must run from webble directory
    pause
    exit /b 1
)

REM Initialize git if needed
if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
    git remote add origin https://github.com/christo-steyn/webble.git
)

REM Generate manifest if firmware exists
if exist "firmware" (
    echo.
    set /p regenerate="Regenerate firmware manifest? This will overwrite existing manifest.json (y/n): "
    if /i "%regenerate%"=="y" (
        echo Generating firmware manifest...
        python generate_firmware_manifest.py
    ) else (
        echo Skipping manifest generation
    )
)

REM Stage, commit, and push
echo.
echo Staging files...
git add -A

echo.
echo Committing changes...
set /p message="Enter commit message (or press Enter for default): "
if "%message%"=="" set message=Update webble deployment
git commit -m "%message%"

echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo === Deployment Successful! ===
    echo.
    echo Your site will be available at:
    echo https://christo-steyn.github.io/webble/
    echo.
    echo Note: GitHub Pages may take 1-2 minutes to update
) else (
    echo.
    echo === Deployment Failed ===
    echo Check the errors above
)

echo.
pause
