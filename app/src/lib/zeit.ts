import type { Aufgabe, Einheit, Klasse } from '../db/types';

export function toMin(t: string | undefined): number | undefined {
  const m = t?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? undefined : h * 60 + min;
}

export function fromMin(min: number): string {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function dauerMin(von: string, bis: string): number {
  const a = toMin(von);
  const b = toMin(bis);
  return a === undefined || b === undefined || b <= a ? 0 : b - a;
}

/** 95 → „1 h 35 min“, 120 → „2 h“, 40 → „40 min“. */
export function formatDauer(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

/** Dezimalstunden mit Komma, z. B. 95 → „1,6 h“. */
export function formatStunden(min: number): string {
  return `${(Math.round((min / 60) * 10) / 10).toString().replace('.', ',')} h`;
}

export const STANDARD_DOPPEL_MIN = 90;

/** Uhrzeit einer Einheit: eigener Wert, sonst Beginn der Klasse plus Länge der Doppelstunde. */
export function einheitZeit(e: Einheit, klasse: Klasse | undefined, doppelMin = STANDARD_DOPPEL_MIN): { von: string; bis: string } | undefined {
  const von = e.beginn ?? (e.zusatz ? klasse?.zusatzBeginn ?? klasse?.beginn : klasse?.beginn);
  const v = toMin(von);
  if (v === undefined) return undefined;
  return { von: von!, bis: e.ende && toMin(e.ende) !== undefined ? e.ende : fromMin(v + doppelMin) };
}

/** Uhrzeit einer Verpflichtung/Aufgabe; liest zur Not das alte Textfeld „07:30–08:00“. */
export function aufgabeZeit(a: Aufgabe): { von: string; bis?: string } | undefined {
  if (a.von && toMin(a.von) !== undefined) return { von: a.von, bis: a.bis && toMin(a.bis) !== undefined ? a.bis : undefined };
  const m = a.zeit?.match(/(\d{1,2}[:.]\d{2})\s*[–-]?\s*(\d{1,2}[:.]\d{2})?/);
  if (!m) return undefined;
  const norm = (x: string) => fromMin(toMin(x.replace('.', ':').replace(/^(\d):/, '0$1:'))!);
  return { von: norm(m[1]), bis: m[2] ? norm(m[2]) : undefined };
}

export const spanne = (von: string, bis?: string) => (bis ? `${von}–${bis}` : von);
