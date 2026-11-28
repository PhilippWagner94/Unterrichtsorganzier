// Datentypen des Unterrichtsorganizers. Alle Datumswerte sind lokale Kalendertage als 'YYYY-MM-DD'.

export type ID = string;
export type Datum = string; // 'YYYY-MM-DD'

export interface Fach {
  id: ID;
  name: string;
  kuerzel?: string;
  eigene?: boolean; // vom Nutzer angelegt (ohne mitgelieferten Lehrplan)
}

export type VerpflichtungsArt = 'fortbildung' | 'aufsicht_hof' | 'aufsicht_mittag' | 'fruehaufsicht' | 'beratung' | 'elterngespraech' | 'sonstiges';

/** Aufgabe (zu erledigen bis …) oder Verpflichtung (Aufsicht, Beratung, Gespräch – einmalig oder wiederkehrend). */
export interface Aufgabe {
  id: ID;
  typ: 'aufgabe' | 'verpflichtung';
  titel: string;
  details: string;
  faellig?: Datum; // Aufgabe: bis wann; einmalige Verpflichtung: Datum (bei mehrtägigen: erster Tag)
  bisDatum?: Datum; // letzter Tag bei mehrtägigen einmaligen Verpflichtungen (z. B. Fortbildung)
  erledigt: boolean;
  erledigtAm?: string;
  einheitId?: ID; // z. B. Vorbereitung für diese Stunde
  klasseId?: ID;
  kategorie?: 'vorbereitung' | 'verwaltung' | 'elternkontakt' | 'sonstiges';
  art?: VerpflichtungsArt;
  wiederholung?: 'einmalig' | 'woechentlich' | 'zweiwoechentlich';
  wochentag?: number; // 1 = Montag … 5 = Freitag
  woche?: 'gerade' | 'ungerade'; // bei zweiwöchentlich: in welchen Kalenderwochen
  von?: string; // Uhrzeit 'HH:MM'
  bis?: string;
  zeit?: string; // (alt) freier Text, z. B. "07:30–08:00"
  ort?: string;
  erstellt: number;
}

export type LernbereichArt = 'pflicht' | 'wahl' | 'optional';

export interface Lernbereich {
  id: ID;
  fachId: ID;
  name: string;
  kuerzel: string;
  richtwertMin: number; // Unterrichtsstunden (Ustd.)
  richtwertMax: number;
  art: LernbereichArt;
  aktiv: boolean;
  farbe: string;
  sortierung: number;
}

export type Doppelstufe = '1/2' | '3/4';

export interface Lernziel {
  id: ID;
  lernbereichId: ID;
  doppelstufe: Doppelstufe;
  text: string;
  sortierung: number;
}

export interface Schuljahr {
  id: ID;
  name: string; // z. B. '2026/27'
  start: Datum;
  ende: Datum;
}

export type FreierTagArt = 'ferien' | 'feiertag' | 'frei';

export interface FreierTag {
  id: ID;
  schuljahrId: ID;
  von: Datum;
  bis: Datum;
  bezeichnung: string;
  art: FreierTagArt;
}

export interface Klasse {
  id: ID;
  name: string; // z. B. '4a'
  einschulungsjahr: number; // Kalenderjahr der Einschulung (Klasse 1 beginnt im August dieses Jahres)
  wochentag: number; // 1 = Montag ... 5 = Freitag; Doppelstunde jede Woche
  zusatzAktiv: boolean; // zusätzliche Doppelstunde alle 2 Wochen
  zusatzWochentag: number;
  zusatzWoche?: 'gerade' | 'ungerade'; // in welchen Kalenderwochen (ISO) die Zusatzstunde liegt; Standard ungerade
  archiviert: boolean;
  beginn?: string; // Beginn der Doppelstunde, 'HH:MM'
  zusatzBeginn?: string; // Beginn der Zusatz-Doppelstunde
}

export type Geschlecht = 'w' | 'm' | 'd';

export interface Schueler {
  id: ID;
  klasseId: ID;
  vorname: string;
  nachname: string;
  geburtsdatum: Datum;
  geschlecht?: Geschlecht;
  hinweis?: string;
  befreit?: boolean; // dauerhaft nicht bewertbar (z. B. Langzeiterkrankung): taucht nie in offenen Tests auf
}

export interface PlanBlock {
  id: ID;
  fachId?: ID; // leer = Sport
  klasseId: ID;
  schuljahrId: ID;
  lernbereichId: ID | null; // null = Pufferblock
  titel?: string;
  anzahl: number; // Anzahl Einheiten (Doppelstunden)
  sortierung: number;
}

export type EinheitStatus =
  | 'geplant'
  | 'gehalten'
  | 'ausfall'
  | 'vertretung'
  | 'verschoben';

export type Ort = 'halle' | 'draussen' | 'beides';

export interface EinheitTest {
  testId: ID;
  ausgenommen: ID[]; // Kinder, deren Ergebnis nicht mehr nachgeholt wird
  abgeschlossen?: boolean; // Rest nicht mehr nachfragen
}

export interface Einheit {
  fachId?: ID; // leer = Sport (Vorbereitung für weitere Fächer)
  id: ID;
  klasseId: ID;
  schuljahrId: ID;
  datum: Datum;
  status: EinheitStatus;
  blockId: ID | null;
  lernbereichId: ID | null;
  istPuffer: boolean;
  fixiert: boolean; // vom automatischen Verteilen des Jahresplans ausgenommen
  titel: string;
  zielIds: ID[];
  spielIds: ID[];
  reiheIds: ID[];
  aufwaermen: string;
  hauptteil: string;
  ausklang: string;
  material: string;
  ort: Ort;
  wetterAlternative: string;
  reflexion: string;
  notizen: string;
  vertretungsnotiz: string;
  ausfallGrund: string;
  tests?: EinheitTest[]; // in dieser Einheit durchgeführte Tests/Bewertungen
  beginn?: string; // abweichender Beginn dieser Einheit ('HH:MM')
  ende?: string; // abweichendes Ende
  zusatz?: boolean; // Termin ist die Zusatz-Doppelstunde
  sollDatum?: Datum; // ursprünglicher Regeltermin, falls diese Einheit verlegt wurde
  wettkampfId?: ID;
}

export interface Spiel {
  id: ID;
  titel: string;
  beschreibung: string;
  dauerMin?: number;
  gruppeMin?: number;
  gruppeMax?: number;
  material: string;
  ort: Ort;
  ziele: string[]; // Schlagwörter, z. B. 'Aufwärmen', 'Kooperation'
  quelle: string; // z. B. 'Kleine Spiele, S. 42'
  variationen?: string; // mögliche Abwandlungen des Spiels
  favorit: boolean;
  erstellt: number;
}

export interface ReihenSchritt {
  titel: string;
  beschreibung: string;
}

export interface MethodischeReihe {
  id: ID;
  thema: string;
  lernbereichId?: ID;
  schritte: ReihenSchritt[];
  sicherheit: string;
  quelle: string;
  erstellt: number;
}

export type TestTyp = 'messwert' | 'note' | 'verbal' | 'punkte';

export interface BewertungsZeile {
  klassenstufe: number | 'alle';
  geschlecht: Geschlecht | 'alle';
  grenze: number;
  note: number;
}

export interface Test {
  id: ID;
  name: string;
  typ: TestTyp;
  einheit: string; // 's', 'm', 'min', 'Anzahl', 'Punkte' ...
  richtung: 'min' | 'max'; // 'min': kleiner ist besser, 'max': größer ist besser
  tabelle: BewertungsZeile[];
  beschreibung: string;
}

export interface Testergebnis {
  id: ID;
  testId: ID;
  schuelerId: ID;
  datum: Datum;
  wert?: number;
  note?: number;
  verbal?: string;
}

export interface CheckPunkt {
  text: string;
  erledigt: boolean;
}

export interface Wettkampf {
  id: ID;
  name: string;
  datum: Datum;
  ort: string;
  notizen: string;
  klassenstufen: number[];
  teilnahme: 'kinder' | 'lehrkraft';
  schuelerIds: ID[];
  checkliste: CheckPunkt[];
}

export interface Notiz {
  id: ID;
  titel: string;
  text: string;
  erstellt: number;
}

export interface Anhang {
  id: ID;
  bezugTyp: 'spiel' | 'reihe' | 'einheit' | 'notiz' | 'wettkampf' | 'foto';
  bezugId: ID | null;
  name: string;
  mime: string;
  blob: Blob;
  erstellt: number;
}

export interface LernzielMarke {
  id: ID;
  klasseId: ID;
  schuljahrId: ID;
  lernzielId: ID;
  status: 'nicht'; // als 'nicht behandelt' markiert
}

export interface Einstellung {
  key: string;
  value: unknown;
}

export interface ZeitKategorie {
  id: ID;
  name: string;
  sortierung: number;
}

/** Erfasste Arbeitszeit (manuell, per Stoppuhr oder aus dem Tagesplan übernommen). */
export interface Zeiteintrag {
  id: ID;
  datum: Datum;
  von: string; // 'HH:MM'
  bis: string;
  kategorieId: ID;
  notiz: string;
  bezugTyp?: 'einheit' | 'verpflichtung';
  bezugId?: ID;
  erstellt: number;
}

export interface ZeitEinstellungen {
  doppelMin: number; // Länge einer Doppelstunde in Minuten
  schuleVon: string; // übliche Anwesenheit in der Schule
  schuleBis: string;
}

export interface ZeitGruppe {
  id: ID;
  name: string;
  kategorieIds: ID[];
}

/** Wiederverwendbarer Stundenentwurf (ohne Klasse, Datum und persönliche Notizen). */
export interface Entwurf {
  id: ID;
  titel: string;
  klassenstufe?: number;
  lernbereichId?: ID;
  zielIds: ID[];
  spielIds: ID[];
  reiheIds: ID[];
  aufwaermen: string;
  hauptteil: string;
  ausklang: string;
  material: string;
  ort?: Ort;
  wetterAlternative: string;
  erstellt: number;
}
