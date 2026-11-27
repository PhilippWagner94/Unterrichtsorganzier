// Datentypen des Unterrichtsorganizers. Alle Datumswerte sind lokale Kalendertage als 'YYYY-MM-DD'.

export type ID = string;
export type Datum = string; // 'YYYY-MM-DD'

export interface Fach {
  id: ID;
  name: string;
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
}

export interface PlanBlock {
  id: ID;
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

export interface Einheit {
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
