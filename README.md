# Zugly 🚆

Dein persönliches Zugradar — wie Flightly, aber für Züge.

## Features

- **Echtzeit-Suche** via Deutsche Bahn API (v6.db.transport.rest, kein API-Key nötig)
- **Stationsautocomplete** mit allen DB-Bahnhöfen
- **Verbindungsdetails** mit Zwischenhalten und Gleisangaben
- **Fahrttagebuch** — logge welche Züge du gefahren bist
- **Bewertungen & Notizen** pro Fahrt
- **Statistiken** — km, Stunden, Pünktlichkeit, Errungenschaften
- **Offline-Speicherung** im Browser (localStorage)

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Die App läuft dann auf http://localhost:5173/zugly/

## GitHub Pages Deployment

### Einmalig einrichten:

1. Repo auf GitHub erstellen (Name: `zugly`)
2. In GitHub: Settings → Pages → Source: **GitHub Actions**
3. Code pushen:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/zugly.git
git push -u origin main
```

4. GitHub Actions baut die App automatisch und deployed sie.
5. Deine App läuft dann unter: `https://DEIN-USERNAME.github.io/zugly/`

### Wichtig: `vite.config.js` anpassen

Der `base`-Pfad muss deinem Repo-Namen entsprechen:

```js
// vite.config.js
export default defineConfig({
  base: '/zugly/',  // ← Repo-Name hier eintragen
  ...
})
```

## Verwendete API

[v6.db.transport.rest](https://v6.db.transport.rest/) — öffentliche, kostenlose REST-API für Deutsche Bahn Daten.
Kein Account, kein API-Key notwendig. Echtzeit-Daten direkt aus dem HAFAS-System der DB.

## Tech Stack

- React 18 + Vite
- date-fns für Datumformatierung
- localStorage für Datenpersistenz
- DB HAFAS REST API für Live-Zugdaten
