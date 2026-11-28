import { db } from '../db/db';
import { zeileAusJson, zeileZuJson } from '../db/backup';
import type { Einheit, Entwurf, Spiel } from '../db/types';
import { spielMitKanonischenTags } from './tags';
import { klassenstufe, schuljahrStartjahr } from './schuljahr';

export const MATERIAL_FORMAT = 'unterrichtsorganizer-material';

export interface MaterialAuswahl {
  spiele: boolean;
  reihen: boolean;
  entwuerfe: boolean; // gespeicherte Entwürfe
  ausEinheiten: boolean; // Inhalte der eigenen Einheiten als Entwürfe
  tests: boolean; // nur Definitionen, keine Ergebnisse
  notizen: boolean;
  bilder: boolean;
}

export interface MaterialDatei {
  format: string;
  version: number;
  exportiert: string;
  tabellen: Record<string, Record<string, unknown>[]>;
}

/** Entwurf aus einer Einheit: nur Inhalte, nichts Personenbezogenes (keine Notizen, Reflexion, Vertretung, Klasse, Datum). */
export function entwurfAusEinheit(e: Einheit, stufe?: number): Entwurf {
  return {
    id: `ent-${e.id}`, titel: e.titel, klassenstufe: stufe, lernbereichId: e.lernbereichId ?? undefined,
    zielIds: e.zielIds, spielIds: e.spielIds, reiheIds: e.reiheIds, aufwaermen: e.aufwaermen, hauptteil: e.hauptteil,
    ausklang: e.ausklang, material: e.material, ort: e.ort, wetterAlternative: e.wetterAlternative, erstellt: Date.now(),
  };
}

/** Einheit mit dem Inhalt eines Entwurfs füllen (vorhandene Texte bleiben, Neues wird angehängt). */
export function inhaltAusEntwurf(e: Einheit, d: Entwurf): Partial<Einheit> {
  const neu = (alt: string, add: string) => (add.trim() ? (alt.trim() ? `${alt}\n\n${add.trim()}` : add.trim()) : alt);
  return {
    titel: e.titel || d.titel,
    zielIds: [...new Set([...e.zielIds, ...d.zielIds])],
    spielIds: [...new Set([...e.spielIds, ...d.spielIds])],
    reiheIds: [...new Set([...e.reiheIds, ...d.reiheIds])],
    aufwaermen: neu(e.aufwaermen, d.aufwaermen),
    hauptteil: neu(e.hauptteil, d.hauptteil),
    ausklang: neu(e.ausklang, d.ausklang),
    material: neu(e.material, d.material),
    wetterAlternative: neu(e.wetterAlternative, d.wetterAlternative),
    ...(d.ort ? { ort: d.ort } : {}),
  };
}

export async function erzeugeMaterialExport(a: MaterialAuswahl): Promise<{ text: string; anzahl: Record<string, number> }> {
  const tabellen: MaterialDatei['tabellen'] = {};
  const ids: Record<string, Set<string>> = { spiel: new Set(), reihe: new Set(), notiz: new Set() };
  const zeilen = async (z: object[]) => Promise.all(z.map((x) => zeileZuJson(x as Record<string, unknown>)));
  if (a.spiele) { const l = await db.spiele.toArray(); l.forEach((x) => ids.spiel.add(x.id)); tabellen.spiele = await zeilen(l); }
  if (a.reihen) { const l = await db.reihen.toArray(); l.forEach((x) => ids.reihe.add(x.id)); tabellen.reihen = await zeilen(l); }
  if (a.notizen) { const l = await db.notizen.toArray(); l.forEach((x) => ids.notiz.add(x.id)); tabellen.notizen = await zeilen(l); }
  if (a.tests) tabellen.tests = await zeilen(await db.tests.toArray());
  if (a.entwuerfe || a.ausEinheiten) {
    let l: Entwurf[] = a.entwuerfe ? await db.entwuerfe.toArray() : [];
    if (a.ausEinheiten) {
      const [einheiten, klassen] = await Promise.all([db.einheiten.toArray(), db.klassen.toArray()]);
      const aus = einheiten
        .filter((e) => (e.status === 'gehalten' || e.status === 'geplant') && !e.istPuffer && !!(e.titel || e.aufwaermen || e.hauptteil || e.ausklang || e.material || e.spielIds.length || e.reiheIds.length))
        .map((e) => {
          const k = klassen.find((x) => x.id === e.klasseId);
          return entwurfAusEinheit(e, k ? Math.min(4, Math.max(1, klassenstufe(k, schuljahrStartjahr(e.datum)))) : undefined);
        });
      const vorhanden = new Set(l.map((x) => x.id));
      l = [...l, ...aus.filter((x) => !vorhanden.has(x.id))];
    }
    // Verweise auf nicht mitexportierte Spiele/Reihen entfernen
    l = l.map((d) => ({ ...d, spielIds: d.spielIds.filter((i) => ids.spiel.has(i)), reiheIds: d.reiheIds.filter((i) => ids.reihe.has(i)) }));
    tabellen.entwuerfe = await zeilen(l);
  }
  if (a.bilder) {
    const l = (await db.anhaenge.toArray()).filter((x) => (x.bezugTyp === 'spiel' && ids.spiel.has(x.bezugId ?? '')) || (x.bezugTyp === 'reihe' && ids.reihe.has(x.bezugId ?? '')) || (x.bezugTyp === 'notiz' && ids.notiz.has(x.bezugId ?? '')));
    tabellen.anhaenge = await zeilen(l);
  }
  const datei: MaterialDatei = { format: MATERIAL_FORMAT, version: 1, exportiert: new Date().toISOString(), tabellen };
  return { text: JSON.stringify(datei), anzahl: Object.fromEntries(Object.entries(tabellen).map(([k, v]) => [k, v.length])) };
}

export class MaterialFehler extends Error {}

export function parseMaterial(text: string): MaterialDatei {
  let d: Partial<MaterialDatei>;
  try { d = JSON.parse(text); } catch { throw new MaterialFehler('Die Datei ist nicht lesbar.'); }
  if (!d || d.format !== MATERIAL_FORMAT || typeof d.tabellen !== 'object' || d.tabellen === null)
    throw new MaterialFehler('Das ist keine Materialdatei des Unterrichtsorganizers (ein Gesamt-Backup bitte unter „Backup einspielen“ öffnen).');
  if (typeof d.version !== 'number' || d.version > 1) throw new MaterialFehler('Die Datei stammt von einer neueren App-Version.');
  return d as MaterialDatei;
}

const ZIEL: Record<string, 'spiele' | 'reihen' | 'notizen' | 'tests' | 'entwuerfe' | 'anhaenge'> = {
  spiele: 'spiele', reihen: 'reihen', notizen: 'notizen', tests: 'tests', entwuerfe: 'entwuerfe', anhaenge: 'anhaenge',
};

/** Fügt nur Neues hinzu; vorhandene Einträge (gleiche ID) bleiben unangetastet. */
export async function importiereMaterial(d: MaterialDatei): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const [name, tabelle] of Object.entries(ZIEL)) {
    let zeilen = (d.tabellen[name] ?? []).map(zeileAusJson) as { id: string }[];
    if (name === 'spiele') zeilen = (zeilen as unknown as Spiel[]).map(spielMitKanonischenTags);
    if (!zeilen.length) continue;
    const t = db.table(tabelle);
    const da = new Set((await t.bulkGet(zeilen.map((z) => z.id))).filter(Boolean).map((z) => z.id));
    const neu = zeilen.filter((z) => !da.has(z.id));
    if (neu.length) await t.bulkAdd(neu);
    out[name] = neu.length;
  }
  return out;
}


