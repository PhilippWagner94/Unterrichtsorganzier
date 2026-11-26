import { db } from '../db/db';
import type { Einheit } from '../db/types';
import { bloeckeNachAusfall, verteile, type NachAusfall, type VerteilErgebnis } from './plan';

/** Verteilt den Jahresplan einer Klasse neu auf die offenen Termine und speichert das Ergebnis. */
export async function planNeuVerteilen(klasseId: string, schuljahrId: string): Promise<VerteilErgebnis> {
  return db.transaction('rw', [db.einheiten, db.planBloecke], async () => {
    const einheiten = await db.einheiten.where('[klasseId+schuljahrId]').equals([klasseId, schuljahrId]).toArray();
    const bloecke = await db.planBloecke.where('[klasseId+schuljahrId]').equals([klasseId, schuljahrId]).toArray();
    const ergebnis = verteile(einheiten, bloecke);
    if (ergebnis.geaendert.length) await db.einheiten.bulkPut(ergebnis.geaendert);
    return ergebnis;
  });
}

/**
 * Markiert eine Einheit als Ausfall und passt den Plan an.
 * aktion: 'verwerfen' (Inhalt entfällt), 'puffer' (nächste Pufferstunde wird aufgebraucht),
 * 'nachruecken' (Inhalt rutscht auf den nächsten Termin).
 */
export async function markiereAusfall(
  einheitId: string,
  grund: string,
  aktion: NachAusfall,
  wettkampfId?: string,
): Promise<void> {
  await db.transaction('rw', [db.einheiten, db.planBloecke], async () => {
    const e = await db.einheiten.get(einheitId);
    if (!e) return;
    const bloecke = await db.planBloecke.where('[klasseId+schuljahrId]').equals([e.klasseId, e.schuljahrId]).toArray();
    const geaenderteBloecke = bloeckeNachAusfall(bloecke, e, aktion);
    if (geaenderteBloecke.length) await db.planBloecke.bulkPut(geaenderteBloecke);
    await db.einheiten.put({
      ...e,
      status: 'ausfall',
      ausfallGrund: grund,
      wettkampfId: wettkampfId ?? e.wettkampfId,
      // der Inhalt gehört nicht mehr zu dieser Einheit
      blockId: null,
      lernbereichId: null,
      istPuffer: false,
    });
    const alle = await db.einheiten.where('[klasseId+schuljahrId]').equals([e.klasseId, e.schuljahrId]).toArray();
    const bloeckeNeu = await db.planBloecke.where('[klasseId+schuljahrId]').equals([e.klasseId, e.schuljahrId]).toArray();
    const ergebnis = verteile(alle, bloeckeNeu);
    if (ergebnis.geaendert.length) await db.einheiten.bulkPut(ergebnis.geaendert);
  });
}

/** Einheit wieder auf „geplant“ setzen (z. B. versehentlich als Ausfall markiert) und Plan neu verteilen. */
export async function stelleEinheitWiederHer(einheitId: string): Promise<void> {
  const e = await db.einheiten.get(einheitId);
  if (!e) return;
  await db.einheiten.put({ ...e, status: 'geplant', ausfallGrund: '', vertretungsnotiz: '' } satisfies Einheit);
  await planNeuVerteilen(e.klasseId, e.schuljahrId);
}
