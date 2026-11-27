import type { Datum } from '../db/types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Lokales Datum als 'YYYY-MM-DD' (nicht UTC, damit der Tag in Deutschland stimmt). */
export function toYmd(d: Date): Datum {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' als lokales Datum um 12:00 Uhr (vermeidet Sommerzeit-Randfälle). */
export function fromYmd(s: Datum): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function heute(): Datum {
  return toYmd(new Date());
}

export function addTage(s: Datum, tage: number): Datum {
  const d = fromYmd(s);
  d.setDate(d.getDate() + tage);
  return toYmd(d);
}

export function tageZwischen(von: Datum, bis: Datum): number {
  return Math.round((fromYmd(bis).getTime() - fromYmd(von).getTime()) / 86400000);
}

/** 1 = Montag ... 7 = Sonntag */
export function wochentag(s: Datum): number {
  const w = fromYmd(s).getDay();
  return w === 0 ? 7 : w;
}

/** Montag der Woche, in der das Datum liegt. */
export function wochenStart(s: Datum): Datum {
  return addTage(s, -(wochentag(s) - 1));
}

export function inBereich(s: Datum, von: Datum, bis: Datum): boolean {
  return s >= von && s <= bis;
}

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONATE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

export function wochentagName(nr1bis5: number): string {
  return WOCHENTAGE[nr1bis5 % 7];
}

export function monatName(monat0bis11: number): string {
  return MONATE[monat0bis11];
}

/** z. B. 'Do, 26.11.2026' */
export function formatLang(s: Datum): string {
  const d = fromYmd(s);
  return `${WOCHENTAGE_KURZ[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** z. B. '26.11.' */
export function formatKurz(s: Datum): string {
  const d = fromYmd(s);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
}

/** z. B. '26.11.2026' */
export function formatDatum(s: Datum): string {
  const d = fromYmd(s);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Gültiges 'YYYY-MM-DD'? */
export function istGueltig(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = fromYmd(s);
  return toYmd(d) === s;
}

/** ISO-Kalenderwoche (Mo–So, Woche 1 enthält den ersten Donnerstag). */
export function isoWoche(s: Datum): number {
  const d = fromYmd(s);
  const tag = (d.getDay() + 6) % 7; // Mo=0
  d.setDate(d.getDate() - tag + 3); // Donnerstag der Woche
  const ersterDo = new Date(d.getFullYear(), 0, 4);
  const diff = (d.getTime() - ersterDo.getTime()) / 86400000;
  return 1 + Math.round((diff - 3 + ((ersterDo.getDay() + 6) % 7)) / 7);
}
