import type { Aufgabe, Datum, Zeiteintrag, ZeitKategorie } from '../db/types';
import { addTage, formatKurz, fromYmd, monatName, toYmd, wochentag } from './dates';
import { schuljahrStartjahr } from './schuljahr';
import { dauerMin } from './zeit';

export const STANDARD_KATEGORIEN: Omit<ZeitKategorie, 'sortierung'>[] = [
  { id: 'zk-unterricht', name: 'Unterricht' },
  { id: 'zk-aufsicht', name: 'Aufsichten' },
  { id: 'zk-beratung', name: 'Dienstberatung / Gremien' },
  { id: 'zk-eltern', name: 'Elterngespräche' },
  { id: 'zk-vorbereitung', name: 'Vorbereitung' },
  { id: 'zk-nachbereitung', name: 'Nachbereitung' },
  { id: 'zk-korrektur', name: 'Korrektur und Noten' },
  { id: 'zk-verwaltung', name: 'Verwaltung und Organisation' },
  { id: 'zk-sonstiges', name: 'Sonstiges' },
];

export const STANDARD_GRUPPEN = [
  { id: 'zg-praesenz', name: 'Unterricht + Aufsichten', kategorieIds: ['zk-unterricht', 'zk-aufsicht'] },
  { id: 'zg-vor-nach', name: 'Vor- und Nachbereitung', kategorieIds: ['zk-vorbereitung', 'zk-nachbereitung', 'zk-korrektur'] },
  { id: 'zg-gespraeche', name: 'Gespräche und Gremien', kategorieIds: ['zk-beratung', 'zk-eltern'] },
];

export const KATEGORIE_FUER_ART: Record<NonNullable<Aufgabe['art']>, string> = {
  aufsicht_hof: 'zk-aufsicht',
  aufsicht_mittag: 'zk-aufsicht',
  fruehaufsicht: 'zk-aufsicht',
  beratung: 'zk-beratung',
  elterngespraech: 'zk-eltern',
  sonstiges: 'zk-sonstiges',
};

export const minuten = (z: Zeiteintrag) => dauerMin(z.von, z.bis);

export interface Zeitraum {
  von: Datum;
  bis: Datum;
  label: string;
}

export type ZeitraumTyp = 'dieseWoche' | 'letzteWoche' | 'dieserMonat' | 'letzterMonat' | 'halbjahr' | 'schuljahr' | 'eigen';

const montag = (d: Datum) => addTage(d, -(wochentag(d) - 1));
const monatsErster = (j: number, m: number) => toYmd(new Date(j, m, 1, 12));
const monatsLetzter = (j: number, m: number) => toYmd(new Date(j, m + 1, 0, 12));

export function zeitraum(typ: ZeitraumTyp, heute: Datum, eigen?: { von: Datum; bis: Datum }): Zeitraum {
  const d = fromYmd(heute);
  const sy = schuljahrStartjahr(heute);
  switch (typ) {
    case 'dieseWoche': { const v = montag(heute); return { von: v, bis: addTage(v, 6), label: 'Diese Woche' }; }
    case 'letzteWoche': { const v = addTage(montag(heute), -7); return { von: v, bis: addTage(v, 6), label: 'Letzte Woche' }; }
    case 'dieserMonat': return { von: monatsErster(d.getFullYear(), d.getMonth()), bis: monatsLetzter(d.getFullYear(), d.getMonth()), label: 'Dieser Monat' };
    case 'letzterMonat': { const x = new Date(d.getFullYear(), d.getMonth() - 1, 1, 12); return { von: monatsErster(x.getFullYear(), x.getMonth()), bis: monatsLetzter(x.getFullYear(), x.getMonth()), label: 'Letzter Monat' }; }
    case 'schuljahr': return { von: `${sy}-08-01`, bis: `${sy + 1}-07-31`, label: `Schuljahr ${sy}/${String(sy + 1).slice(2)}` };
    case 'halbjahr': {
      const erstes = heute <= `${sy + 1}-01-31`;
      return erstes
        ? { von: `${sy}-08-01`, bis: `${sy + 1}-01-31`, label: '1. Halbjahr' }
        : { von: `${sy + 1}-02-01`, bis: `${sy + 1}-07-31`, label: '2. Halbjahr' };
    }
    default: return { von: eigen?.von ?? heute, bis: eigen?.bis ?? heute, label: 'Zeitraum' };
  }
}

/** Der unmittelbar vorangehende gleich lange Zeitraum (Woche → Vorwoche, Monat → Vormonat, sonst gleiche Länge davor). */
export function vorherigerZeitraum(z: Zeitraum, typ: ZeitraumTyp): Zeitraum {
  if (typ === 'dieseWoche' || typ === 'letzteWoche') return { von: addTage(z.von, -7), bis: addTage(z.von, -1), label: 'davor' };
  if (typ === 'dieserMonat' || typ === 'letzterMonat') {
    const d = fromYmd(z.von);
    const x = new Date(d.getFullYear(), d.getMonth() - 1, 1, 12);
    return { von: monatsErster(x.getFullYear(), x.getMonth()), bis: monatsLetzter(x.getFullYear(), x.getMonth()), label: 'davor' };
  }
  if (typ === 'schuljahr') {
    const sy = Number(z.von.slice(0, 4)) - 1;
    return { von: `${sy}-08-01`, bis: `${sy + 1}-07-31`, label: 'Vorjahr' };
  }
  if (typ === 'halbjahr') {
    const sy = Number(z.von.slice(0, 4));
    return z.von.endsWith('-08-01')
      ? { von: `${sy - 1}-02-01`, bis: `${sy}-07-31`, label: 'davor' }
      : { von: `${sy - 1}-08-01`, bis: `${sy}-01-31`, label: 'davor' };
  }
  const tage = Math.round((fromYmd(z.bis).getTime() - fromYmd(z.von).getTime()) / 86400000) + 1;
  return { von: addTage(z.von, -tage), bis: addTage(z.von, -1), label: 'davor' };
}

export function imZeitraum(liste: Zeiteintrag[], z: Zeitraum, kategorien?: Set<string>): Zeiteintrag[] {
  return liste.filter((e) => e.datum >= z.von && e.datum <= z.bis && (!kategorien || kategorien.has(e.kategorieId)));
}

export const summe = (liste: Zeiteintrag[]) => liste.reduce((s, e) => s + minuten(e), 0);

export function nachKategorie(liste: Zeiteintrag[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of liste) m.set(e.kategorieId, (m.get(e.kategorieId) ?? 0) + minuten(e));
  return m;
}

export interface Periode {
  key: string;
  label: string;
  von: Datum;
  bis: Datum;
  minuten: number;
}

/** Zeitreihe zum Vergleichen: die letzten Wochen, Monate oder alle Schuljahre mit Einträgen. */
export function perioden(liste: Zeiteintrag[], art: 'woche' | 'monat' | 'schuljahr', heute: Datum, kategorien?: Set<string>): Periode[] {
  const out: Periode[] = [];
  const mk = (key: string, label: string, von: Datum, bis: Datum) =>
    out.push({ key, label, von, bis, minuten: summe(imZeitraum(liste, { von, bis, label }, kategorien)) });
  if (art === 'woche') {
    for (let i = 7; i >= 0; i--) {
      const v = addTage(montag(heute), -7 * i);
      mk(v, formatKurz(v), v, addTage(v, 6));
    }
  } else if (art === 'monat') {
    const d = fromYmd(heute);
    for (let i = 5; i >= 0; i--) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1, 12);
      mk(`${x.getFullYear()}-${x.getMonth()}`, `${monatName(x.getMonth()).slice(0, 3)} ${String(x.getFullYear()).slice(2)}`, monatsErster(x.getFullYear(), x.getMonth()), monatsLetzter(x.getFullYear(), x.getMonth()));
    }
  } else {
    const jahre = new Set(liste.map((e) => schuljahrStartjahr(e.datum)));
    jahre.add(schuljahrStartjahr(heute));
    for (const sy of [...jahre].sort()) mk(String(sy), `${sy}/${String(sy + 1).slice(2)}`, `${sy}-08-01`, `${sy + 1}-07-31`);
  }
  return out;
}

/** Wochen mit mindestens einem Eintrag im Zeitraum (für „Ø pro Woche“). */
export function wochenMitEintraegen(liste: Zeiteintrag[]): number {
  return new Set(liste.map((e) => montag(e.datum))).size;
}
