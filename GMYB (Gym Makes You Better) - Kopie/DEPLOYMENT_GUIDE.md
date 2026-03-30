# 🚀 Deployment Guide - GMYB PWA

## Kurzanleitung: Hochladen als PWA

### 1️⃣ Vorbereitung (lokal)

```bash
# Stelle sicher dass folgende Dateien vorhanden sind:
✅ manifest.json          # PWA Manifest
✅ service-worker.js      # Offline Support
✅ index.html             # Mit meta tags + service worker script
✅ lib/style.css          # Responsive CSS
✅ lib/script.js          # JavaScript
✅ bilder/                # Alle Bilder
```

### 2️⃣ Icons erstellen (WICHTIG!)

Die App braucht Icons für Installation zu funktionieren:

**Option A: Online Tool (einfach)**
1. Gehe zu: https://realfavicongenerator.net/
2. Lade dein Gym-Logo hoch
3. Lade alle generierten Icons herunter
4. Speicheru als:
   - `bilder/icon-192.png`
   - `bilder/icon-512.png`
   - `bilder/icon-maskable.png` (für adaptive icons)

**Option B: Mit GIMP/Photoshop**
1. Erstelle 192x192px PNG (mit transparentem Hintergrund)
2. Speichern als `icon-192.png`
3. Skalieren auf 512x512px
4. Speichern als `icon-512.png`

### 3️⃣ Professionelle Deployment-Optionen

#### 🟢 EMPFOHLEN: Netlify (kostenlos, einfach)

1. **Repo vorbereiten**
   ```bash
   # Lokale git repo initialisieren
   git init
   git add .
   git commit -m "GMYB PWA - Initial commit"
   ```

2. **Auf GitHub hochladen**
   - GitHub Konto erstellen: https://github.com
   - Neues Repository erstellen: "GMYB"
   - Code hochladen (Visual Studio Code or Git):
   ```bash
   git remote add origin https://github.com/DEIN_USERNAME/GMYB.git
   git branch -M main
   git push -u origin main
   ```

3. **Auf Netlify deployen**
   - https://netlify.com aufrufen
   - "New site from Git" klicken
   - GitHub wählen + authorize
   - Repository "GMYB" auswählen
   - Build Settings:
     * Build command: (leer lassen)
     * Deploy directory: `.` (Punkt)
   - "Deploy site" klicken
   - Warten auf grünen Check ✅
   - **Fertig!** App ist live unter `xxxx.netlify.app`

#### 🟡 ALTERNATIV: Vercel (auch kostenlos)

1. https://vercel.com gehen
2. "New Project" → GitHub auswählen
3. Repository GMYB auswählen
4. Automatically configured - "Deploy" drücken
5. Fertig!

#### 🔵 ALTERNATIV: Firebase Hosting

```bash
# Installation
npm install -g firebase-tools

# Login
firebase login

# Initialisierung
firebase init hosting
# Bei Fragen:
# - Public directory: . (punkt)
# - Configure rewrite: yes
# - Overwrite index.html: no

# Deployment
firebase deploy
```

#### 🟠 ALTERNATIV: Eigener Server (Apache/Nginx)

1. **Per FTP/SFTP hochladen:**
   ```
   Host: FTP-Server Ihrer Domain
   Alle Dateien in /public_html/ (oder root)
   ```

2. **Apache .htaccess erstellen** (im root):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   
   # Gzip Compression
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/plain
     AddOutputFilterByType DEFLATE text/html
     AddOutputFilterByType DEFLATE text/xml
     AddOutputFilterByType DEFLATE application/json
     AddOutputFilterByType DEFLATE application/javascript
     AddOutputFilterByType DEFLATE text/css
   </IfModule>
   
   # Cache Headers
   <FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$">
     Header set Cache-Control "max-age=31536000, public"
   </FilesMatch>
   ```

3. **HTTPS aktivieren** (WICHTIG!)
   - In Hosting-Panel auf "SSL Zertifikat" gehen
   - Let's Encrypt auswählen (kostenlos)
   - Automatically apply geben

### 4️⃣ Nach dem Deploy - Überprüfung

#### PWA Tests

```
Chrome DevTools:
1. F12 drücken
2. Application Tab wählen
3. Manifest file - ✅ sollte alle Einstellungen zeigen
4. Service Worker - ✅ sollte "activated and running" zeigen
5. Lighthouse Tab → PWA Audit durchführen
   - Score sollte 90+ sein
```

#### Installations-Test

**Chrome/Edge:**
1. URL-Leiste oben rechts
2. "App installieren" Button
3. App sollte installierbar sein

**iOS Safari:**
1. Share Button drücken
2. "Zum Startbildschirm"
3. App erscheint auf Startbildschirm

**Android Chrome:**
1. Menu (3 Punkte) oben rechts
2. "App installieren"
3. App installiert

#### Offline-Test

1. DevTools offnen (F12)
2. Network Tab → Throttling → "Offline" wählen
3. F5 zum Neuladen
4. App sollte weiterhin funktionieren (mit gecachtem Content)

### 5️⃣ Firebase Firestore Konfiguration

Falls Sie Firebase als Backend nutzen möchten:

```javascript
// In script.js hinzufügen:

// Firebase Konfiguration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "1:YOUR_APP_ID:web:YOUR_WEB_ID"
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);

// Authentifizierung + Firestore
const auth = firebase.auth();
const db = firebase.firestore();
```

### 6️⃣ Domain-Setup (Optional)

**Wenn Sie eine Custom Domain wollen:**

#### Ohne Domain (kostenlos)
- Netlify gibt automatisch eine Domain: `xxxx.netlify.app`

#### Mit eigener Domain
1. Domain registrieren: https://www.namecheap.com oder https://www.ionos.com
2. DNS-Einstellungen anpassen:
   - Bei Netlify: Settings → Domain Management → Add Custom Domain
   - Folgen Sie den Anweisungen
3. DNS-Records aktualisieren (Nameserver setzen)
4. Bis zu 24h warten bis aktiv

### 7️⃣ Version Updates

```javascript
// Wenn Sie eine neue Version deployen:
// Erhöhen Sie die Cache Version in service-worker.js:

const CACHE_NAME = 'gmyb-v2';  // ← Version erhöhen

// User sollte Browser neu laden (CTRL+SHIFT+R) oder 
// App neu installieren für neue Version
```

### 8️⃣ Monitoring & Analytics

**Google Analytics hinzufügen:**

```html
<!-- In head tag von index.html: -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXX-X"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXXXX-X');
</script>
```

### 🆘 Häufige Probleme

| Problem | Lösung |
|---------|--------|
| Service Worker wird nicht registriert | Nur auf HTTPS möglich - Domain aktivieren |
| App nicht installierbar | Icons fehlen - `bilder/icon-192.png` + `icon-512.png` erstellen |
| Offline funktioniert nicht | Network Tab: Offline enabled? Service Worker active? |
| alte Version wird gecacht | CACHE_NAME erhöhen + Hard Refresh (CTRL+SHIFT+R) |
| Firebase API Fehler | API Keys in Firebase Console überprüfen + aktivieren |
| CORS Fehler | Backend muss CORS Header setzen |

---

## Checkliste vor Public Launch

- [ ] Manifest.json korrekt ausgefüllt
- [ ] Icons (192x512) in `bilder/` vorhanden
- [ ] Service-worker.js im Root
- [ ] HTTPS aktiviert (für Production)
- [ ] Firebase Konfiguration (wenn SQL used)
- [ ] Alle Links funktionieren
- [ ] Offline Test erfolgreich
- [ ] PWA Audit Score 90+
- [ ] Auf Mobilgerät getestet
- [ ] Performance optimiert (bilder optimiert)

---

**Fragen?** Code-Fehler prüfen → DevTools Console (F12)

**Version:** 1.0  
**Datum:** 30. März 2026
