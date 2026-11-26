import type { Geschlecht, Test, Testergebnis } from '../db/types';

/**
 * Note für einen Messwert anhand der Bewertungstabelle des Tests.
 * Es gilt der spezifischste Satz: Zeilen für genau diese Klassenstufe/dieses Geschlecht gehen vor Zeilen mit 'alle'.
 * Bei 'max' (größer ist besser) zählt wert >= grenze, bei 'min' (kleiner ist besser) wert <= grenze.
 * Es wird die beste (kleinste) passende Note zurückgegeben.
 */
export function noteFuerWert(
  test: Pick<Test, 'richtung' | 'tabelle'>,
  wert: number,
  klassenstufe: number,
  geschlecht: Geschlecht | undefined,
): number | undefined {
  const passend = test.tabelle.filter(
    (z) =>
      (z.klassenstufe === 'alle' || z.klassenstufe === klassenstufe) &&
      (z.geschlecht === 'alle' || z.geschlecht === geschlecht),
  );
  if (passend.length === 0) return undefined;
  const spez = (z: (typeof passend)[number]) =>
    (z.klassenstufe !== 'alle' ? 1 : 0) + (z.geschlecht !== 'alle' ? 1 : 0);
  const maxSpez = Math.max(...passend.map(spez));
  const zeilen = passend.filter((z) => spez(z) === maxSpez);
  const erfuellt = zeilen.filter((z) => (test.richtung === 'max' ? wert >= z.grenze : wert <= z.grenze));
  if (erfuellt.length === 0) return undefined;
  return Math.min(...erfuellt.map((z) => z.note));
}

export function durchschnitt(noten: number[]): number | undefined {
  if (noten.length === 0) return undefined;
  return Math.round((noten.reduce((a, b) => a + b, 0) / noten.length) * 10) / 10;
}

/** Bestes Ergebnis (Messwert) eines Kindes in einem Test. */
export function bestleistung(test: Pick<Test, 'richtung'>, ergebnisse: Testergebnis[]): Testergebnis | undefined {
  const mitWert = ergebnisse.filter((e) => typeof e.wert === 'number');
  if (mitWert.length === 0) return undefined;
  return mitWert.reduce((best, e) =>
    test.richtung === 'max' ? (e.wert! > best.wert! ? e : best) : e.wert! < best.wert! ? e : best,
  );
}

export function formatNote(note: number | undefined): string {
  if (note === undefined) return '–';
  return Number.isInteger(note) ? String(note) : note.toFixed(1).replace('.', ',');
}
