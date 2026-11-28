import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getEinstellung, setEinstellung } from '../../db/db';
import type { ZeitEinstellungen, ZeitGruppe, ZeitKategorie } from '../../db/types';
import { STANDARD_GRUPPEN, STANDARD_KATEGORIEN } from '../../lib/arbeitszeit';
import { STANDARD_DOPPEL_MIN } from '../../lib/zeit';

export const STANDARD_ZEIT: ZeitEinstellungen = { doppelMin: STANDARD_DOPPEL_MIN, schuleVon: '07:30', schuleBis: '14:00' };

/** Legt die Standard-Kategorien einmalig an (fehlende werden nachgetragen, nichts wird überschrieben). */
async function ensureKategorien() {
  const vorhanden = new Set((await db.zeitKategorien.toArray()).map((k) => k.id));
  // Standard-Kategorien lassen sich nicht löschen; fehlende (auch neu hinzugekommene) werden ergänzt
  const neu = STANDARD_KATEGORIEN.map((k, i) => ({ ...k, sortierung: i })).filter((k) => !vorhanden.has(k.id));
  if (neu.length) await db.zeitKategorien.bulkPut(neu);
}

export function useZeitKategorien(): ZeitKategorie[] {
  useEffect(() => { void ensureKategorien(); }, []);
  const liste = useLiveQuery(() => db.zeitKategorien.toArray(), [], []) ?? [];
  return [...liste].sort((a, b) => a.sortierung - b.sortierung);
}

export function useZeitEinstellungen(): ZeitEinstellungen {
  const e = useLiveQuery(() => getEinstellung<ZeitEinstellungen>('zeitEinstellungen', STANDARD_ZEIT), [], STANDARD_ZEIT);
  return { ...STANDARD_ZEIT, ...(e ?? {}) };
}

export function useZeitGruppen(): ZeitGruppe[] {
  return useLiveQuery(() => getEinstellung<ZeitGruppe[]>('zeitGruppen', STANDARD_GRUPPEN), [], STANDARD_GRUPPEN) ?? STANDARD_GRUPPEN;
}

/** Für Berechnungen außerhalb von React. */
export const ladeZeitEinstellungen = async () => ({ ...STANDARD_ZEIT, ...(await getEinstellung<Partial<ZeitEinstellungen>>('zeitEinstellungen', {})) });
