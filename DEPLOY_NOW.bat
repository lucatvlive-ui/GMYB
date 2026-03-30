@echo off
REM 🚀 GMYB Quick Deploy for Windows PowerShell

echo.
echo ================================
echo 🏋️  GMYB - Quick Deploy
echo ================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git nicht installiert!
    echo Installiere von: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo 📁 Projekt vorbereiten...
echo.

REM Check if this is a GMYB project
if not exist "manifest.json" (
    echo ❌ manifest.json nicht gefunden!
    echo Bitte starte dieses Script im GMYB-Ordner
    pause
    exit /b 1
)

echo ✅ GMYB Projektstruktur erkannt
echo.

REM Initialize Git if needed
if not exist ".git" (
    echo 🔧 Git Repository wird initialiert...
    git init
    echo ✅ Git Repository erstellt
) else (
    echo ✅ Git Repository existiert bereits
)

echo.
echo 📦 Dateien werden vorbereitet...
git add .

REM Get current date for commit message
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
git commit -m "GMYB Deployment %mydate%"

echo.
echo ================================
echo 📋 NÄCHSTE SCHRITTE:
echo ================================
echo.
echo 1️⃣  GitHub Repository erstellen (kostenlos):
echo.
echo    → https://github.com/signup (falls noch kein Account)
echo    → Nach Login: https://github.com/new
echo    → Repository Name: GMYB
echo    → Public wählen
echo    → Create Repository
echo.
echo 2️⃣  Code hochladen mit PowerShell:
echo.
echo    git remote add origin https://github.com/DEIN_USERNAME/GMYB.git
echo    git push -u origin main
echo.
echo    (Ersetze DEIN_USERNAME mit deinem GitHub Benutzernamen)
echo    (Bei Prompt: username + Token eingeben)
echo.
echo 3️⃣  Netlify mit GitHub verbinden:
echo.
echo    → https://netlify.com
echo    → "Sign Up" → GitHub auswählen
echo    → GitHub authorisieren
echo    → "New site from Git"
echo    → GitHub auswählen
echo    → GMYB Repository auswählen
echo    → "Deploy site" klicken
echo.
echo ================================
echo 🎉 FERTIG!
echo ================================
echo.
echo Deine App ist dann online unter:
echo https://ZUFALLSNAME.netlify.app
echo.
pause
