#!/bin/bash

# 🚀 GMYB Quick Deploy Script
# Für Netlify/GitHub Deployment

echo "================================"
echo "🏋️ GMYB - Quick Deploy Script"
echo "================================"
echo ""

# Überprüfe ob Git installiert ist
if ! command -v git &> /dev/null; then
    echo "❌ Git nicht installiert!"
    echo "Installiere Git von: https://git-scm.com/download"
    exit 1
fi

echo "📁 Projekt vorbereiten..."

# Überprüfe ob manifest.json vorhanden ist
if [ ! -f "manifest.json" ]; then
    echo "⚠️  manifest.json nicht gefunden!"
    exit 1
fi

echo "✅ Projektstruktur ok"
echo ""

# Git Setup
echo "🔧 Git initialisieren..."

if [ ! -d ".git" ]; then
    git init
    echo "✅ Git Repository erstellt"
else
    echo "✅ Git Repository existiert schon"
fi

# Stage alle Dateien
echo "📦 Dateien hochladen..."
git add .
git commit -m "GMYB App - Deploy $(date +%Y-%m-%d)"

echo ""
echo "================================"
echo "📋 NÄCHSTE SCHRITTE:"
echo "================================"
echo ""
echo "1️⃣  GitHub Repository erstellen:"
echo "    → https://github.com/new"
echo "    → Name: GMYB"
echo "    → Public wählen"
echo ""
echo "2️⃣  Code hochladen:"
echo "    git remote add origin https://github.com/DEIN_USERNAME/GMYB.git"
echo "    git push -u origin main"
echo ""
echo "3️⃣  Netlify verbinden:"
echo "    → https://netlify.com"
echo "    → GitHub authorisieren"
echo "    → Repository auswählen"
echo "    → Deploy!"
echo ""
echo "🎉 FERTIG! App ist online!"
echo ""
