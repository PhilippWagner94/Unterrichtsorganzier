# Unterrichtsorganizer

Private Web-App (PWA) für Grundschul-Sportunterricht in Sachsen: Jahresplan, Kalender, Klassen und Kinder,
Geburtstage, Spielesammlung, Wettkämpfe, Tests und Noten, Foto-Import mit lokaler Texterkennung.

- Alle Daten bleiben auf dem Gerät (IndexedDB). Es gibt keinen Server und keine KI-Dienste.
- Sicherung: Mehr → Sicherung (JSON-Datei exportieren/importieren).
- Einheiten umsortieren geschieht mit ▲▼-Knöpfen (kein Ziehen, weil iOS das nicht zuverlässig kann).

## Veröffentlichen (GitHub Pages)
Repository → Settings → Pages → **Source: GitHub Actions**. Danach baut `.github/workflows/deploy.yml`
bei jedem Push auf `main` die App. Adresse: https://philippwagner94.github.io/Unterrichtsorganzier/

## iPhone
Adresse in **Safari** öffnen → Teilen → „Zum Home-Bildschirm“. Danach läuft die App wie eine normale App, auch offline.

## Entwicklung
```
cd app && npm ci && npm run dev   # Entwicklung
npm test && npm run build         # Tests und Produktionsbuild
```
Die OCR-Dateien (`public/tesseract`) werden beim Start/Build automatisch aus `node_modules` kopiert.
