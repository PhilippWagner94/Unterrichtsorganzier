import type { Einheit, Schueler } from '../db/types';

export const FEHLVERHALTEN_VORAUSWAHL = [
  'Stört den Unterricht',
  'Missachtet Regeln',
  'Streit / Handgreiflichkeit',
  'Keine Sportsachen',
  'Verweigert Mitarbeit',
  'Gefährdet andere',
  'Unentschuldigt zu spät',
];

export interface FehlverhaltenHinweis {
  einheit: Einheit;
  schueler: Schueler;
  gruende: string[];
  text: string;
}

/** Fehlverhalten aus der letzten erfassten Stunde derselben Klasse vor `e`. */
export function fehlverhaltenAusVorstunde(einheiten: Einheit[], e: Pick<Einheit, 'klasseId' | 'datum' | 'id'>, schueler: Schueler[]): FehlverhaltenHinweis[] {
  const vorher = einheiten
    .filter((x) => x.klasseId === e.klasseId && x.id !== e.id && x.anwesenheitErfasst && x.datum <= e.datum && !(x.datum === e.datum && x.id > e.id))
    .sort((a, b) => b.datum.localeCompare(a.datum))[0];
  if (!vorher?.anwesenheit) return [];
  const out: FehlverhaltenHinweis[] = [];
  for (const a of vorher.anwesenheit) {
    if (!a.fehlverhalten) continue;
    const s = schueler.find((x) => x.id === a.schuelerId);
    if (s) out.push({ einheit: vorher, schueler: s, gruende: a.gruende ?? [], text: a.text ?? '' });
  }
  return out;
}

/** Stunden, deren Anwesenheit noch nicht erfasst wurde (beendet, innerhalb der letzten `tage` Tage). */
export function anwesenheitOffen(
  einheiten: Einheit[],
  heute: string,
  jetztMin: number,
  endeMin: (e: Einheit) => number | undefined,
  tage = 7,
): Einheit[] {
  const grenze = new Date(heute + 'T12:00:00');
  grenze.setDate(grenze.getDate() - tage);
  const g = grenze.toISOString().slice(0, 10);
  return einheiten
    .filter((e) => (e.status === 'geplant' || e.status === 'gehalten') && !e.anwesenheitErfasst && e.datum >= g && e.datum <= heute)
    .filter((e) => e.datum < heute || (endeMin(e) !== undefined && jetztMin >= endeMin(e)!))
    .sort((a, b) => a.datum.localeCompare(b.datum));
}
