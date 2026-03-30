# 🏋️ Gym Makes You Better - PWA

**GMYB** ist eine Progressive Web App für Fitness-Tracking und Trainingsplanung.

## ✨ Features

- 📱 **PWA Ready** - Installierbar auf Desktop und Mobile
- 🏠 **Offline Support** - App funktioniert auch ohne Internet
- 💾 **Fitness Tracking** - Verfolge deine Workouts
- 📊 **Analytics** - Trainingshistorie und Statistiken
- 💡 **Expert Tips** - Tipps von Profisportlern
- 🎯 **Trainingsplan** - Erstelle deinen eigenen Plan
- 🌙 **Dark Mode** - Optimiert für Augen

## 🚀 Installation & Deployment

### Local Entwicklung
1. Alle Dateien in einen Ordner kopieren
2. Mit lokalem Server starten (z.B. `python -m http.server` oder Live Server in VS Code)
3. App im Browser öffnen: `http://localhost:8000`

### PWA Installation
- **Chrome/Edge**: Auf die URL-Leiste oben rechts, dann "App installieren"
- **iOS Safari**: Teilen Button → "Zum Startbildschirm"
- **Android Chrome**: Menu → "App installieren"

### Deployment auf Server

#### Mit Netlify (empfohlen)
1. Repo auf GitHub hochladen
2. Auf https://netlify.com gehen
3. "New site from Git" wählen
4. Bei Build Settings:
   - Build command: (leer lassen oder `echo 'noop'`)
   - Publish directory: `.` (root)
5. Fertig! App ist live

#### Mit Vercel
1. Code auf GitHub pushen
2. https://vercel.com gehen
3. "New Project" → GitHub auswählen
4. Automatisch konfiguriert
5. Deploy!

#### Mit Firebase Hosting (wenn Firebase bereits genutzt wird)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# public folder als root directory angeben
firebase deploy
```

#### Mit eigenem Server
1. Alle Dateien per FTP/SFTP hochladen
2. **WICHTIG**: Server muss HTTPS unterstützen (für Service Worker)
3. `.htaccess` erstellen (siehe unten):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 🔐 HTTPS Anforderung

Service Worker (Offline Support) funktionieren nur mit:
- ✅ HTTPS auf Live-Server
- ✅ localhost (Entwicklung)
- ⚠️ Nicht mit HTTP auf Production!

## 📁 Dateistruktur

```
GMYB/
├── index.html              # Dashboard (PWA Start)
├── Login.html              # Login Seite
├── Profil.html             # Profil & Settings
├── Heutiges-Workout.html   # Workout Tracking
├── Trainingsplan.html      # Plan Editor
├── Tips.html               # Tipps von Profis
├── Historie.html           # Trainingsgeschichte
├── manifest.json           # PWA Manifest
├── service-worker.js       # Offline Support
├── lib/
│   ├── script.js           # Haupt-JavaScript
│   └── style.css           # CSS Styles
└── bilder/
    ├── Logo_white.png
    ├── icon-192.png        # PWA Icon 192x192
    ├── icon-512.png        # PWA Icon 512x512
    └── gym_background.png
```

## 🛠️ Verbesserungen die noch gemacht werden können

### Kurzfristig (High Priority)
1. **User Authentication**
   - Login/Registration mit Firebase Authentication
   - User-spezifische Daten speichern

2. **Daten Persistierung**
   - IndexedDB für lokale Datenspeicherung
   - Sync mit Firebase Firestore

3. **Responsive Design**
   - Mobile-first Redesign
   - Tablet-Optimierung
   - Touch-freundliche Buttons (min 48x48px)

4. **Performance**
   - CSS/JS minification
   - Image Optimization
   - Lazy Loading

### Mittelfristig (Medium Priority)
1. **Notifications**
   - Push Notifications für Workout-Reminders
   - Weekly Progress Report

2. **Social Features**
   - Freunde hinzufügen
   - Workout Challenges
   - Leaderboard

3. **Erweiterte Analytics**
   - 3D Progress Charts
   - Body Measurement Tracking
   - PR Tracking

4. **Wearable Integration**
   - Apple Health / Google Fit Sync
   - Smartwatch Support

### Langfristig (Low Priority)
1. **Community Features**
   - Workout Plans Sharing
   - Discussion Forum
   - User-generated Content

2. **AI/ML Features**
   - Personalisierte Workout-Empfehlungen
   - Form Correction mit Kamera (Computer Vision)
   - Ernährungsplan Generator

3. **E-Commerce**
   - GMYB Merchandise Shop
   - Premium Features/Subscription

## 🔗 Externe Services

- **Firebase**: Authentication, Database, Hosting
- **Icons**: Alle Icons sind Unicode Emojis (kostenlos)
- **Bilder**: Müssen selbst hinzugefügt werden

## 📝 Checkliste vor Launch

- [ ] `manifest.json` angepasst (Name, Icons, URLs)
- [ ] `service-worker.js` getestet
- [ ] HTTPS aktiviert (erforderlich!)
- [ ] Icons (192x192 und 512x512) hinzugefügt
- [ ] Firebase Konfiguration fertig
- [ ] **index.html** startet mit `/` (root path)
- [ ] Alle Links funktionieren
- [ ] Offline-Funktionalität getestet
- [ ] Auf iOS/Android getestet

## 🧪 Testing

### PWA Audit (Chrome)
1. DevTools öffnen (F12)
2. Lightroom Tab → PWA Audit durchführen
3. Score sollte 90+ sein

### Service Worker testen
1. DevTools → Application Tab
2. Service Worker registriert prüfen
3. Cache Storage durchschauen
4. Offline testen (DevTools → Network → Offline)

## 📱 App Icons

Folgende Icons werden für beste Kompatibilität benötigt:
- `bilder/icon-192.png` (192x192px)
- `bilder/icon-512.png` (512x512px)  
- `bilder/icon-maskable.png` (192x192px - für adaptive icons)

Verwenden Sie einen Icon Generator: https://realfavicongenerator.net/

## 🆘 Troubleshooting

### Service Worker wird nicht registriert
- ✅ Nur auf HTTPS oder localhost möglich
- ✅ DevTools Console auf Fehler prüfen
- ✅ Browser Cache leeren

### Seite lädt Offline nicht
- ✅ Service Worker installieren prüfen
- ✅ Cache siehe DevTools → Application → Cache Storage
- ✅ `service-worker.js` im Root liegen (nicht im Ordner)

### PWA wird nicht installierbar
- ✅ manifest.json vorhanden und korrekt?
- ✅ HTTPS?
- ✅ Icons im manifest definiert?
- ✅ Icons auf Server vorhanden?

## 📞 Support

Bei Fragen oder Issues - bitte im Code Comments hinzufügen oder fehlerhafte URL prüfen.

---

**Version:** 1.0 PWA  
**Datum:** 2026-03-30  
**Status:** 🟢 Production Ready
