#!/bin/bash

# GMYB Quick Start Script
# Bereitet die App für Deployment vor

echo "🏋️  GMYB - Gym Makes You Better PWA"
echo "=========================================="
echo ""
echo "✅ Überprüfe erforderliche Dateien..."
echo ""

# Überprüfe verzeichnis Struktur
required_files=(
    "manifest.json"
    "service-worker.js"
    "index.html"
    "lib/script.js"
    "lib/style.css"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file vorhanden"
    else
        echo "❌ $file FEHLT!"
        missing_files=$((missing_files + 1))
    fi
done

echo ""
echo "=========================================="

# Überprüfe Icons
echo "📱 Icon-Check..."
if [ -f "bilder/icon-192.png" ]; then
    echo "✅ icon-192.png vorhanden"
else
    echo "⚠️  icon-192.png FEHLT - App nicht installierbar!"
fi

if [ -f "bilder/icon-512.png" ]; then
    echo "✅ icon-512.png vorhanden"
else
    echo "⚠️  icon-512.png FEHLT - App nicht installierbar!"
fi

echo ""
echo "=========================================="
echo "📋 Nächste Schritte:"
echo "=========================================="

if [ $missing_files -eq 0 ]; then
    echo "1. Icons erstellen: https://realfavicongenerator.net/"
    echo "2. Firebase Schlüssel in script.js eingeben"
    echo "3. Git initialisieren: git init"
    echo "4. Auf GitHub pushen"
    echo "5. Auf Netlify/Vercel deployen"
    echo ""
    echo "✅ App ist bereit für Deployment!"
else
    echo "⚠️  Bitte fehlende Dateien hinzufügen!"
fi

echo ""
