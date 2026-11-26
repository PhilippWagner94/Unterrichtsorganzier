import { useLiveQuery } from 'dexie-react-hooks';
import { db, getEinstellung, setEinstellung } from './db';
import type { Datum, Klasse, Schuljahr } from './types';
import { heute } from '../lib/dates';
import { klassenstufe, schuljahrStartjahr } from '../lib/schuljahr';

/** Schuljahr, in dem das Datum liegt; sonst das nächste kommende, sonst das letzte. */
export function waehleSchuljahr(liste: Schuljahr[], datum: Datum): Schuljahr | undefined {
  const sortiert = [...liste].sort((a, b) => a.start.localeCompare(b.start));
  return (
    sortiert.find((s) => datum >= s.start && datum <= s.ende) ??
    sortiert.find((s) => s.start > datum) ??
    sortiert[sortiert.length - 1]
  );
}

export function useSchuljahre(): Schuljahr[] {
  return useLiveQuery(() => db.schuljahre.orderBy('start').toArray(), [], []) ?? [];
}

/** Aktives Schuljahr: manuell gewähltes (Einstellung) oder das zum heutigen Datum passende. */
export function useAktivesSchuljahr(): Schuljahr | undefined {
  const liste = useSchuljahre();
  const gewaehlt = useLiveQuery(() => getEinstellung<string | null>('schuljahrId', null), [], null);
  return (gewaehlt ? liste.find((s) => s.id === gewaehlt) : undefined) ?? waehleSchuljahr(liste, heute());
}

export async function setzeAktivesSchuljahr(id: string | null): Promise<void> {
  await setEinstellung('schuljahrId', id);
}

export interface KlasseMitStufe {
  klasse: Klasse;
  stufe: number;
}

/** Klassen, die im angegebenen Schuljahr aktiv sind (Stufe 1–4, nicht archiviert), nach Stufe und Name. */
export function aktiveKlassen(klassen: Klasse[], schuljahr: Schuljahr | undefined): KlasseMitStufe[] {
  if (!schuljahr) return [];
  const start = schuljahrStartjahr(schuljahr.start);
  return klassen
    .filter((k) => !k.archiviert)
    .map((k) => ({ klasse: k, stufe: klassenstufe(k, start) }))
    .filter((x) => x.stufe >= 1 && x.stufe <= 4)
    .sort((a, b) => a.stufe - b.stufe || a.klasse.name.localeCompare(b.klasse.name, 'de'));
}

export function useKlassenAktiv(): KlasseMitStufe[] {
  const klassen = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const sj = useAktivesSchuljahr();
  return aktiveKlassen(klassen, sj);
}

/** Klasse mit berechneter Stufe im Schuljahr (auch für archivierte Klassen). */
export function stufeIm(klasse: Klasse, schuljahr: Schuljahr | undefined): number | undefined {
  if (!schuljahr) return undefined;
  return klassenstufe(klasse, schuljahrStartjahr(schuljahr.start));
}
