import type { Datum, Schueler } from '../db/types';
import { addTage, fromYmd, toYmd } from './dates';

export interface Geburtstag {
  schueler: Schueler;
  datum: Datum; // Tag, an dem der Geburtstag gefeiert wird
  alter: number;
}

/** Datum des Geburtstags im Kalenderjahr; der 29. Februar wird in Nicht-Schaltjahren auf den 28. Februar gelegt. */
export function geburtstagImJahr(geburtsdatum: Datum, jahr: number): Datum {
  const [, m, d] = geburtsdatum.split('-').map(Number);
  const istSchaltjahr = (jahr % 4 === 0 && jahr % 100 !== 0) || jahr % 400 === 0;
  const tag = m === 2 && d === 29 && !istSchaltjahr ? 28 : d;
  return toYmd(new Date(jahr, m - 1, tag, 12));
}

/**
 * Alle Geburtstage im Zeitraum (vonExklusiv, bisInklusiv], also seit dem letzten Termin bis einschließlich bis.
 * Geburtstage in den Ferien werden mitgezählt. Ohne vonExklusiv gibt es keine Rückschau.
 */
export function geburtstageZwischen(
  schueler: Schueler[],
  vonExklusiv: Datum,
  bisInklusiv: Datum,
): Geburtstag[] {
  const start = addTage(vonExklusiv, 1);
  if (start > bisInklusiv) return [];
  const jahrVon = fromYmd(start).getFullYear();
  const jahrBis = fromYmd(bisInklusiv).getFullYear();
  const treffer: Geburtstag[] = [];
  for (const s of schueler) {
    if (!s.geburtsdatum) continue;
    const geburtsjahr = Number(s.geburtsdatum.slice(0, 4));
    for (let j = jahrVon; j <= jahrBis; j++) {
      const tag = geburtstagImJahr(s.geburtsdatum, j);
      if (tag >= start && tag <= bisInklusiv) {
        treffer.push({ schueler: s, datum: tag, alter: j - geburtsjahr });
      }
    }
  }
  return treffer.sort((a, b) => a.datum.localeCompare(b.datum) || a.schueler.nachname.localeCompare(b.schueler.nachname));
}

/** Geburtstage in den nächsten n Tagen (heute eingeschlossen). */
export function kommendeGeburtstage(schueler: Schueler[], heuteYmd: Datum, tage: number): Geburtstag[] {
  return geburtstageZwischen(schueler, addTage(heuteYmd, -1), addTage(heuteYmd, tage));
}
