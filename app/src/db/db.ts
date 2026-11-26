import Dexie, { type Table } from 'dexie';
import type {
  Anhang,
  Einheit,
  Einstellung,
  Fach,
  FreierTag,
  Klasse,
  Lernbereich,
  Lernziel,
  LernzielMarke,
  MethodischeReihe,
  Notiz,
  PlanBlock,
  Schueler,
  Schuljahr,
  Spiel,
  Test,
  Testergebnis,
  Wettkampf,
} from './types';

export class OrganizerDB extends Dexie {
  faecher!: Table<Fach, string>;
  lernbereiche!: Table<Lernbereich, string>;
  lernziele!: Table<Lernziel, string>;
  schuljahre!: Table<Schuljahr, string>;
  freieTage!: Table<FreierTag, string>;
  klassen!: Table<Klasse, string>;
  schueler!: Table<Schueler, string>;
  planBloecke!: Table<PlanBlock, string>;
  einheiten!: Table<Einheit, string>;
  spiele!: Table<Spiel, string>;
  reihen!: Table<MethodischeReihe, string>;
  tests!: Table<Test, string>;
  testergebnisse!: Table<Testergebnis, string>;
  wettkaempfe!: Table<Wettkampf, string>;
  notizen!: Table<Notiz, string>;
  anhaenge!: Table<Anhang, string>;
  lernzielMarken!: Table<LernzielMarke, string>;
  einstellungen!: Table<Einstellung, string>;

  constructor(name = 'unterrichtsorganizer') {
    super(name);
    this.version(1).stores({
      faecher: 'id',
      lernbereiche: 'id, fachId',
      lernziele: 'id, lernbereichId',
      schuljahre: 'id, start',
      freieTage: 'id, schuljahrId, von',
      klassen: 'id, archiviert',
      schueler: 'id, klasseId',
      planBloecke: 'id, [klasseId+schuljahrId]',
      einheiten: 'id, [klasseId+schuljahrId], datum, klasseId',
      spiele: 'id, titel',
      reihen: 'id, thema',
      tests: 'id',
      testergebnisse: 'id, testId, schuelerId',
      wettkaempfe: 'id, datum',
      notizen: 'id',
      anhaenge: 'id, [bezugTyp+bezugId]',
      lernzielMarken: 'id, [klasseId+schuljahrId]',
      einstellungen: 'key',
    });
  }
}

export const db = new OrganizerDB();

// Tabellen, die in Export/Import enthalten sind (Reihenfolge ist egal, es gibt keine Fremdschlüssel-Prüfung).
export const TABELLEN = [
  'faecher',
  'lernbereiche',
  'lernziele',
  'schuljahre',
  'freieTage',
  'klassen',
  'schueler',
  'planBloecke',
  'einheiten',
  'spiele',
  'reihen',
  'tests',
  'testergebnisse',
  'wettkaempfe',
  'notizen',
  'anhaenge',
  'lernzielMarken',
  'einstellungen',
] as const;

export type TabellenName = (typeof TABELLEN)[number];

export function neueId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getEinstellung<T>(key: string, fallback: T): Promise<T> {
  const e = await db.einstellungen.get(key);
  return e ? (e.value as T) : fallback;
}

export async function setEinstellung(key: string, value: unknown): Promise<void> {
  await db.einstellungen.put({ key, value });
}
