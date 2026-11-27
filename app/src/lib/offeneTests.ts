import type { Einheit, Schueler, Test, Testergebnis } from '../db/types';

export interface OffenerTest {
  einheit: Einheit;
  test: Test;
  fehlend: Schueler[];
}

const hatErgebnis = (e: Testergebnis) => e.wert !== undefined || e.note !== undefined || !!e.verbal;

/** Kinder einer Einheit, für die ein Test noch kein Ergebnis hat (ohne Ausgenommene und dauerhaft Befreite). */
export function fehlendeKinder(einheit: Einheit, testId: string, schueler: Schueler[], ergebnisse: Testergebnis[]): Schueler[] {
  const et = einheit.tests?.find((t) => t.testId === testId);
  if (!et || et.abgeschlossen) return [];
  const fertig = new Set(ergebnisse.filter((e) => e.testId === testId && hatErgebnis(e)).map((e) => e.schuelerId));
  return schueler.filter((s) => s.klasseId === einheit.klasseId && !s.befreit && !et.ausgenommen.includes(s.id) && !fertig.has(s.id));
}

/**
 * Tests, die in einer bereits stattgefundenen Einheit durchgeführt wurden und für die noch Kinder fehlen.
 * Ein später (egal wann) erfasstes Ergebnis zählt als erledigt, Befreite und Ausgenommene werden nie angezeigt.
 */
export function offeneTests(einheiten: Einheit[], tests: Test[], schueler: Schueler[], ergebnisse: Testergebnis[], heute: string): OffenerTest[] {
  const liste: OffenerTest[] = [];
  for (const einheit of einheiten) {
    if (!einheit.tests?.length) continue;
    const stattgefunden = einheit.status === 'gehalten' || (einheit.status === 'geplant' && einheit.datum <= heute);
    if (!stattgefunden) continue;
    for (const et of einheit.tests) {
      const test = tests.find((t) => t.id === et.testId);
      if (!test) continue;
      const fehlend = fehlendeKinder(einheit, et.testId, schueler, ergebnisse);
      if (fehlend.length) liste.push({ einheit, test, fehlend });
    }
  }
  return liste.sort((a, b) => a.einheit.datum.localeCompare(b.einheit.datum));
}
