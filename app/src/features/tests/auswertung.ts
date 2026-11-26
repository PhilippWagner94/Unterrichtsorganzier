import type { Test, Testergebnis } from '../../db/types';

/** Jüngstes Ergebnis (nach Datum, bei gleichem Datum das zuletzt angelegte). */
export function juengstes(ergebnisse: Testergebnis[]): Testergebnis | undefined {
  return [...ergebnisse].sort((a, b) => b.datum.localeCompare(a.datum) || b.id.localeCompare(a.id))[0];
}

/** Jüngstes Ergebnis je Testergebnis-Gruppe (z. B. je Kind und Test): Schlüssel aus keyFn. */
export function juengstePro(ergebnisse: Testergebnis[], keyFn: (e: Testergebnis) => string): Map<string, Testergebnis> {
  const gruppen = new Map<string, Testergebnis[]>();
  for (const e of ergebnisse) gruppen.set(keyFn(e), [...(gruppen.get(keyFn(e)) ?? []), e]);
  const m = new Map<string, Testergebnis>();
  for (const [k, liste] of gruppen) m.set(k, juengstes(liste)!);
  return m;
}

/**
 * Verbesserung vom ersten zum letzten Messwert. Positiv = besser (bei 'min' kleiner, bei 'max' größer).
 * Benötigt mindestens zwei Messwerte.
 */
export function fortschritt(test: Pick<Test, 'richtung'>, ergebnisse: Testergebnis[]): number | undefined {
  const mitWert = ergebnisse.filter((e) => typeof e.wert === 'number').sort((a, b) => a.datum.localeCompare(b.datum));
  if (mitWert.length < 2) return undefined;
  const erst = mitWert[0].wert!;
  const letzt = mitWert[mitWert.length - 1].wert!;
  const diff = test.richtung === 'max' ? letzt - erst : erst - letzt;
  return Math.round(diff * 100) / 100;
}

/** Zahl mit Komma, ohne überflüssige Nachkommastellen, optional mit Einheit. */
export function formatWert(wert: number | undefined, einheit = ''): string {
  if (wert === undefined) return '–';
  const text = String(Math.round(wert * 100) / 100).replace('.', ',');
  return einheit ? `${text} ${einheit}` : text;
}
