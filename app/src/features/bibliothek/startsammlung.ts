import { db } from '../../db/db';
import type { MethodischeReihe, Spiel } from '../../db/types';
import { REIHEN_START, SPIELE_START } from '../../data/spieleStart';

/** Legt die Startsammlung an. Vorhandene (auch bearbeitete oder gelöschte) Einträge werden nicht überschrieben. */
export async function ladeStartsammlung(): Promise<number> {
  const jetzt = Date.now();
  const spiele: Spiel[] = SPIELE_START.map((s, i) => ({
    id: `spiel-start-${String(i + 1).padStart(2, '0')}`,
    titel: s.titel,
    beschreibung: s.beschreibung,
    dauerMin: s.dauerMin,
    gruppeMin: s.gruppeMin,
    gruppeMax: s.gruppeMax,
    material: s.material,
    ort: s.ort,
    ziele: s.ziele,
    quelle: '',
    favorit: false,
    erstellt: jetzt + i,
  }));
  const reihen: MethodischeReihe[] = REIHEN_START.map((r, i) => ({
    id: `reihe-start-${String(i + 1).padStart(2, '0')}`,
    thema: r.thema,
    lernbereichId: `lb-${r.lernbereichKey}`,
    schritte: r.schritte,
    sicherheit: r.sicherheit,
    quelle: '',
    erstellt: jetzt + i,
  }));
  let neu = 0;
  await db.transaction('rw', [db.spiele, db.reihen], async () => {
    for (const s of spiele) if (!(await db.spiele.get(s.id))) (await db.spiele.put(s), neu++);
    for (const r of reihen) if (!(await db.reihen.get(r.id))) (await db.reihen.put(r), neu++);
  });
  return neu;
}
