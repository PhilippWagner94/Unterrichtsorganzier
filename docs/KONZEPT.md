# Unterrichtsorganizer – Konzept

Private Web-App (PWA) zur Planung von Sportunterricht in der Grundschule (Sachsen, Klasse 1–4, teils zweizügig). Alle Daten liegen lokal auf dem Gerät, Export und Import als Datei. Hauptgerät: iPhone.

Stand: 26.11.2026 – Planungsphase, noch kein Code.

---

## 1. Rahmenbedingungen

| Thema | Entscheidung |
|---|---|
| Fach | Zunächst nur Sport. Datenmodell ist fachunabhängig (Fach → Lernbereich → Lernziel), andere Fächer später ergänzbar. |
| Schulstufe | Grundschule Sachsen, Klasse 1–4, Parallelklassen (4a/4b) möglich. |
| Gerät | Fast ausschließlich iPhone (Safari, Installation über „Zum Home-Bildschirm“). |
| Datenschutz | Keine KI, kein Server, kein Login. Schülerdaten verlassen das Gerät nicht. |
| Unterrichtstakt | Standard: **eine Doppelstunde pro Woche** pro Klasse. Manche Klassen haben alle 2 Wochen eine zusätzliche Doppelstunde; sie kann pro Klasse an- oder abgeschaltet werden, weil sie oft entfällt. |
| Schwimmen | Läuft separat und wird in der App ignoriert (in der Lehrplan-Vorlage vorhanden, aber standardmäßig deaktiviert). |
| Wintersport | Optional: bei passenden Bedingungen eine Doppelstunde, sonst entfällt er. Die Stunden werden dann auf andere Lernbereiche verteilt, wie es der Lehrplan vorsieht. |
| Lehrplan | Fachlehrplan Sport Grundschule Sachsen 2019 (`lp_gs_sport_2019.pdf`) als bearbeitbare Vorlage. |

## 2. Was der Lehrplan vorgibt

- Ziele gelten für **Doppelstufen** (Kl. 1/2 und Kl. 3/4). Der Jahresplan muss festhalten, was in Klasse 1 und was in Klasse 2 (bzw. 3 und 4) behandelt wird.
- 25 Pflichtwochen pro Klassenstufe plus 2 Wochen Wahlbereich. Mit einer Doppelstunde pro Woche entspricht das etwa 50 Unterrichtsstunden.
- Zeitrichtwerte in Unterrichtsstunden (Ustd.; eine Doppelstunde sind 2 Ustd.):
  - Leichtathletik 14–24
  - Spiele und Spielformen 8–18
  - Turnerische Übungen 8–18
  - Gymnastisch-tänzerische Übungen 5–10
  - Wintersport 5–9 (optional)
- Wahlbereiche (je 2 Wochen): Bewegung in der Natur, Mini-Sportspiele, Kleine Rückenschule, Olympische Spiele, Koordinative Fähigkeiten.
- Die Reihenfolge der Lernbereiche entscheidet die Lehrkraft. Zeitrichtwerte dürfen variiert werden.
- Ab Klasse 3 sollen Kinder ihre Bestleistungen und Fortschritte dokumentieren (individuelle Bezugsnorm).
- Zu Zensuren und Tests macht der Lehrplan kaum Vorgaben, die Leistungsüberprüfung ist daher frei gestaltbar.

## 3. Funktionen

### Klassen und Schüler
- Klassen anlegen (Name, Einschulungsjahr), Schüler einzeln hinzufügen und bearbeiten (Vorname, Name, Geburtsdatum, Geschlecht, Hinweisfeld).
- **Klassenstufe wird berechnet** (Schuljahr − Einschulungsjahr + 1), nicht gespeichert. Beim Schuljahreswechsel rücken alle automatisch hoch.
- Klasse 4 wird nach dem Schuljahr archiviert, Noten und Daten bleiben erhalten.
- Einzelne Kinder können manuell die Klasse wechseln oder wiederholen.

### Geburtstage
- Anzeige aller Kinder, die seit der **letzten gehaltenen Einheit** der Klasse Geburtstag hatten, inklusive Geburtstagen in den Ferien.
- Zusätzlich Hinweis auf Geburtstage heute und in den nächsten Tagen.
- Sonderfall 29. Februar wird berücksichtigt.

### Jahresplan
- Pro Klasse und Schuljahr eine Folge von Blöcken (Lernbereich, Wochenbereich, geplante Stunden).
- Anzeige pro Lernbereich: geplante Stunden gegenüber dem Richtwert aus dem Lehrplan.
- **Pufferstunden** als eigener Blocktyp. Anzeige „X von Y Puffern übrig“.
- Fällt eine Stunde aus: Vorschlag, einen Puffer zu nutzen oder den Plan nach hinten zu schieben.
- Optionaler Lernbereich (Wintersport): kann mit „entfällt“ markiert werden, die Stunden werden umverteilt.
- **Einheiten abwählen:** Jede geplante Einheit lässt sich als „findet nicht statt“ markieren (Grund optional). Der Inhalt kann dabei verworfen, auf eine Puffer- oder spätere Stunde verschoben oder als „nachholen“ vorgemerkt werden. Auch einzelne Lernziele lassen sich als „nicht behandelt“ markieren.
- **Umsortieren:** Einheiten und ganze Lernbereich-Blöcke lassen sich per Umsortieren mit ▲▼-Knöpfen neu ordnen oder auf ein anderes Datum verschieben. Stundenzähler und Richtwert-Anzeige passen sich automatisch an.
- Änderungen betreffen nur die Planung. Bereits gehaltene Einheiten bleiben unverändert in der Historie.
- Sachsen-Ferien und Feiertage werden als **Vorlage mitgeliefert** (offizielle Termine, in Phase 3 recherchiert) und können pro Schuljahr bearbeitet werden. Zusätzlich lassen sich eigene freie Tage eintragen (z. B. Brückentage, Schulveranstaltungen).

### Kalender und Unterrichtseinheiten
- Kalenderansicht mit allem, was wann ist, und was zuletzt gemacht wurde.
- Einheit mit Datum, Klasse, Lernbereich/Lernziel, Ablauf (Aufwärmen, Hauptteil, Ausklang), Material, Ort (Halle/draußen, Wetter-Alternative) und Reflexion nach der Stunde.
- **Status**: geplant, gehalten, Ausfall, Vertretung, verschoben.
- Bei „Vertretung“: Notizfeld, was ungefähr gemacht wurde. Bei „Ausfall“: Grund (Krankheit, Wettkampf, sonstiges).
- Bewährte Einheiten lassen sich kopieren und für andere Klassen anpassen.

### Wettkämpfe
- **Einzelne Termine**, keine Vorlagen: Name, Datum, Ort, Notizen, betroffene Klassenstufen.
- Teilnehmer: Kinder auswählen **oder** „nur Lehrkraft, keine Kinder“.
- Optionale freie Checkliste (z. B. Anmeldung, Einverständnis, Treffzeit).
- Ein Wettkampftermin kann Einheiten als „Ausfall“ markieren.

### Spiele und Methodik
- Eigene Spielesammlung (Titel, Beschreibung, Dauer, Gruppengröße, Material, Ort, Ziel, Bilder). Filter und Favoriten, Anzeige „zuletzt gespielt“.
- Feld „Quelle“ (z. B. Buchtitel und Seite) zum Verweis auf Literatur. Beschreibungen werden selbst in eigenen Worten eingetragen.
- Methodische Reihen als Schrittfolgen (z. B. Bock, Kletterstange, Rolle) mit Sicherheits- und Hilfestellungshinweisen. Einzelne Schritte lassen sich in eine Einheit übernehmen.

### Tests und Noten (offen gestaltet)
- **Tests werden frei definiert**: Name, Typ (Messwert, Note, verbal, Punkte), Einheit (s, m, min, Anzahl), Richtung („kleiner ist besser“ oder „größer ist besser“).
- Optionale **Bewertungstabelle** pro Test: Grenzwerte → Note, selbst eintragbar, getrennt nach Klassenstufe und Geschlecht, soweit gewünscht.
- Mitgelieferte Beispiele ohne Grenzwerte, jederzeit änderbar: Sprint, Weitsprung, Schlagwurf, Ausdauerlauf.
- Ergebnisse pro Kind und Datum, Anzeige von Bestleistung und Verlauf. Notenübersicht mit Durchschnitt. In Klasse 1 verbale Einschätzung statt Note.

### Fotos
- Foto aufnehmen oder auswählen → lokale Texterkennung (z. B. Tesseract.js, offline) → **Prüfbildschirm** mit allen erkannten Zeilen, die bearbeitet oder gelöscht werden können → Zuordnung zu Spiel, Methodik, Notiz oder Einheit.
- Das Originalbild lässt sich immer zusätzlich als Anhang speichern. Bilder werden verkleinert gespeichert.
- Gedruckter Text wird gut erkannt, Handschrift nur eingeschränkt, daher ist die Korrektur fester Bestandteil.

### Zusatzideen (später)
- Zufallsgruppen/-teams, Stoppuhr, Zufallsauswahl eines Kindes.
- PDF-Druck von Stundenentwürfen und Notenlisten.
- Anwesenheit und Sportbefreiung pro Stunde.
- Dunkelmodus.

## 4. Datenmodell (Entwurf)

| Entität | Kernfelder |
|---|---|
| Schuljahr | Zeitraum, Ferien, Feiertage |
| Klasse | Name, Einschulungsjahr, zusätzliche Doppelstunde ja/nein, aktiv/archiviert |
| Schüler | Vorname, Name, Geburtsdatum, Geschlecht (weiblich/männlich/divers, optional), Hinweis, Klasse |
| Fach | Name |
| Lernbereich | Fach, Name, Richtwert min/max, Pflicht/Wahl/optional, aktiv |
| Lernziel | Lernbereich, Doppelstufe, Text, Klassenstufe der Behandlung |
| Jahresplan-Block | Klasse, Schuljahr, Lernbereich oder Puffer, Wochenbereich, Stunden |
| Einheit | Datum, Klasse, Status, Lernbereich, Ablauf, Material, Reflexion, Vertretungsnotiz |
| Spiel | Titel, Beschreibung, Dauer, Gruppengröße, Material, Ort, Ziel, Quelle, Favorit |
| Methodische Reihe | Thema, Schritte, Sicherheitshinweise |
| Test | Name, Typ, Einheit, Richtung, Bewertungstabelle |
| Testergebnis | Test, Schüler, Datum, Wert/Note |
| Wettkampf | Name, Datum, Ort, Klassenstufen, Teilnehmer oder nur Lehrkraft, Checkliste |
| Anhang | Bild, Verknüpfung zu beliebigem Eintrag |

## 5. Technik

- **Stack:** React, TypeScript, Vite, PWA (vite-plugin-pwa), Dexie (IndexedDB).
- **Mobile-first:** Navigation unten (Heute, Kalender, Klassen, Bibliothek, Mehr), große Tippflächen, Safe-Area beachten.
- **Backup:** Export und Import als JSON (inklusive Bildern), Export über das iOS-Teilen-Menü. Persistenten Speicher anfordern, regelmäßige Backup-Erinnerung (Safari kann lokale Daten bei Nichtnutzung löschen).
- **Lehrplan-Vorlage:** als JSON im Repository, beim ersten Start in die Datenbank geladen und danach bearbeitbar.

### Vorgeschlagene Ordnerstruktur

```
unterrichtsorganzier/
├─ README.md
├─ docs/
│  ├─ KONZEPT.md
│  └─ lehrplan/lp_gs_sport_2019.pdf   (später dorthin verschieben)
└─ app/
   ├─ src/
   │  ├─ db/             Datenbank, Schema, Export/Import
   │  ├─ data/           Lehrplan-Vorlage (JSON)
   │  ├─ features/
   │  │  ├─ klassen/  schueler/  jahresplan/  kalender/  einheiten/
   │  │  ├─ wettkaempfe/  spiele/  methodik/  tests/  foto/  backup/
   │  ├─ components/
   │  └─ lib/            Datum, Geburtstagslogik, Klassenstufe
   └─ public/            PWA-Icons, Manifest
```

## 6. Reihenfolge der Umsetzung

1. Grundgerüst, Datenbank, Export und Import
2. Klassen, Schüler, Geburtstage, Jahrgangswechsel
3. Lehrplan-Vorlage, Jahresplan mit Puffern, Kalender, Ferien
4. Einheiten, Status, Vertretung und Ausfall
5. Wettkampftermine
6. Spiele und methodische Reihen
7. Tests und Noten
8. Fotos mit Texterkennung

## 7. Offene Punkte

- Welche Tests und Bewertungstabellen genutzt werden, wird später direkt in der App eingetragen.

Entschieden: Geschlechtsfeld bei Schülern ja (optional). Ferien und Feiertage Sachsen werden als Vorlage mitgeliefert und sind editierbar.

## Ergänzungen (Aufgaben, Fächer)
- Tabelle `aufgaben`: Aufgaben (mit Fälligkeit, optional an eine Einheit gebunden) und Verpflichtungen (Aufsichten, Beratung, Gespräche; einmalig, wöchentlich oder 2-wöchentlich in gerader/ungerader KW; entfallen in Ferien).
- Fächer: Einstellung `faecher-aktiv:<schuljahrId>` (Standard Sport). `Einheit.fachId` und `PlanBlock.fachId` sind vorbereitet (leer = Sport); Lehrplan und Planung pro Fach sind noch nicht umgesetzt.
- Klasse nicht mehr zuständig: Archivieren entfernt künftige leere Termine, Daten bleiben.
- Arbeitszeit: Tabellen `zeiten` (Einträge von/bis je Kategorie) und `zeitKategorien`; Einstellungen `zeitEinstellungen`, `zeitGruppen` (frei kombinierbare Kategorien). Uhrzeiten: `Klasse.beginn/zusatzBeginn`, `Einheit.beginn/ende`, `Aufgabe.von/bis`. Tagesplan unter `/tag/:datum`.
