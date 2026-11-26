import type { Datum } from '../db/types';
import { addTage, toYmd } from './dates';

/** Ostersonntag nach der Gaußschen Osterformel (gregorianisch). */
export function ostersonntag(jahr: number): Datum {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return toYmd(new Date(jahr, monat - 1, tag, 12));
}

/** Buß- und Bettag: der Mittwoch vor dem 23. November (in Sachsen gesetzlicher Feiertag). */
export function bussUndBettag(jahr: number): Datum {
  const ref = new Date(jahr, 10, 23, 12);
  const wt = ref.getDay(); // 0 = So
  // letzter Mittwoch (3) vor dem 23.11.
  let diff = (wt - 3 + 7) % 7;
  if (diff === 0) diff = 7;
  ref.setDate(ref.getDate() - diff);
  return toYmd(ref);
}

export interface Feiertag {
  datum: Datum;
  name: string;
}

/** Gesetzliche Feiertage in Sachsen für ein Kalenderjahr. */
export function feiertageSachsen(jahr: number): Feiertag[] {
  const ostern = ostersonntag(jahr);
  return [
    { datum: `${jahr}-01-01`, name: 'Neujahr' },
    { datum: addTage(ostern, -2), name: 'Karfreitag' },
    { datum: addTage(ostern, 1), name: 'Ostermontag' },
    { datum: `${jahr}-05-01`, name: 'Tag der Arbeit' },
    { datum: addTage(ostern, 39), name: 'Christi Himmelfahrt' },
    { datum: addTage(ostern, 50), name: 'Pfingstmontag' },
    { datum: `${jahr}-10-03`, name: 'Tag der Deutschen Einheit' },
    { datum: `${jahr}-10-31`, name: 'Reformationstag' },
    { datum: bussUndBettag(jahr), name: 'Buß- und Bettag' },
    { datum: `${jahr}-12-25`, name: '1. Weihnachtsfeiertag' },
    { datum: `${jahr}-12-26`, name: '2. Weihnachtsfeiertag' },
  ].sort((a, b) => a.datum.localeCompare(b.datum));
}

/** Feiertage, die in einen Zeitraum fallen. */
export function feiertageImZeitraum(von: Datum, bis: Datum): Feiertag[] {
  const j1 = Number(von.slice(0, 4));
  const j2 = Number(bis.slice(0, 4));
  const liste: Feiertag[] = [];
  for (let j = j1; j <= j2; j++) liste.push(...feiertageSachsen(j));
  return liste.filter((f) => f.datum >= von && f.datum <= bis);
}
