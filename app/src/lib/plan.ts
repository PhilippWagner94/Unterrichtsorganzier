import type { Datum, Einheit, FreierTag, Klasse, PlanBlock, Schuljahr } from '../db/types';
import { neueId } from '../db/db';
import { addTage, fromYmd, isoWoche, tageZwischen, wochenStart, wochentag } from './dates';
import { feiertageImZeitraum } from './feiertage';

/** Ist das Datum frei (Ferien, freier Tag, gesetzlicher Feiertag)? Gibt die Bezeichnung zurück. */
export function freiBezeichnung(datum: Datum, freieTage: FreierTag[]): string | undefined {
  const t = freieTage.find((f) => datum >= f.von && datum <= f.bis);
  if (t) return t.bezeichnung;
  const fe = feiertageImZeitraum(datum, datum);
  return fe[0]?.name;
}

export interface Slot {
  datum: Datum;
  zusatz: boolean;
}

/** Alle regulären Termine einer Klasse (Haupt- und Zusatzstunde) in einem Schuljahr, ohne Ferien und freie Tage. */
export function terminSlotsMitArt(klasse: Klasse, schuljahr: Schuljahr, freieTage: FreierTag[]): Slot[] {
  const slots: Slot[] = [];
  const paritaet = (klasse.zusatzWoche ?? 'ungerade') === 'gerade' ? 0 : 1;
  for (let d = schuljahr.start; d <= schuljahr.ende; d = addTage(d, 1)) {
    const wt = wochentag(d);
    const haupt = wt === klasse.wochentag;
    const zusatz = klasse.zusatzAktiv && wt === klasse.zusatzWochentag && isoWoche(d) % 2 === paritaet;
    if (!haupt && !zusatz) continue;
    if (freiBezeichnung(d, freieTage)) continue;
    // Fallen beide Tage zusammen, zählt nur ein Termin
    slots.push({ datum: d, zusatz: !haupt });
  }
  return slots;
}

export function terminSlots(klasse: Klasse, schuljahr: Schuljahr, freieTage: FreierTag[]): Datum[] {
  return terminSlotsMitArt(klasse, schuljahr, freieTage).map((s) => s.datum);
}

export function leereEinheit(klasseId: string, schuljahrId: string, datum: Datum): Einheit {
  return {
    id: neueId(),
    klasseId,
    schuljahrId,
    datum,
    status: 'geplant',
    blockId: null,
    lernbereichId: null,
    istPuffer: false,
    fixiert: false,
    titel: '',
    zielIds: [],
    spielIds: [],
    reiheIds: [],
    aufwaermen: '',
    hauptteil: '',
    ausklang: '',
    material: '',
    ort: 'beides',
    wetterAlternative: '',
    reflexion: '',
    notizen: '',
    vertretungsnotiz: '',
    ausfallGrund: '',
  };
}

/** Hat die Einheit Inhalt, den man nicht stillschweigend löschen darf? */
export function hatInhalt(e: Einheit): boolean {
  return !!(e.fixiert || e.titel || e.aufwaermen || e.hauptteil || e.ausklang || e.material || e.notizen || e.reflexion ||
    e.vertretungsnotiz || e.spielIds.length || e.reiheIds.length || e.zielIds.length);
}

/** Neue Einheiten für alle Termine, für die es noch keine Einheit gibt (verlegte Einheiten blockieren ihren Ursprungstermin). */
export function fehlendeEinheiten(
  klasse: Klasse,
  schuljahr: Schuljahr,
  freieTage: FreierTag[],
  vorhandene: Einheit[],
): Einheit[] {
  const belegt = new Set<string>();
  for (const e of vorhandene) {
    belegt.add(e.datum);
    if (e.sollDatum) belegt.add(e.sollDatum);
  }
  return terminSlotsMitArt(klasse, schuljahr, freieTage)
    .filter((s) => !belegt.has(s.datum))
    .map((s) => ({ ...leereEinheit(klasse.id, schuljahr.id, s.datum), zusatz: s.zusatz }));
}

/**
 * Einheiten, die nach einer Änderung des Rhythmus (Wochentag, Zusatzstunde, gerade/ungerade) nicht mehr
 * zu einem Regeltermin passen und gefahrlos entfernt werden können: geplant, nicht verlegt, ohne Inhalt.
 */
export function veralteteEinheiten(
  klasse: Klasse,
  schuljahr: Schuljahr,
  freieTage: FreierTag[],
  vorhandene: Einheit[],
): Einheit[] {
  const gueltig = new Set(terminSlots(klasse, schuljahr, freieTage));
  return vorhandene.filter((e) => e.status === 'geplant' && !e.sollDatum && !gueltig.has(e.datum) && !hatInhalt(e) && e.zusatz !== undefined);
}

export interface SequenzEintrag {
  blockId: string;
  lernbereichId: string | null;
  istPuffer: boolean;
}

/** Plan als Folge von Einzel-Einheiten (jeder Block × Anzahl). */
export function sequenz(bloecke: PlanBlock[]): SequenzEintrag[] {
  const sortiert = [...bloecke].sort((a, b) => a.sortierung - b.sortierung);
  const seq: SequenzEintrag[] = [];
  for (const b of sortiert) {
    for (let i = 0; i < Math.max(0, b.anzahl); i++) {
      seq.push({ blockId: b.id, lernbereichId: b.lernbereichId, istPuffer: b.lernbereichId === null });
    }
  }
  return seq;
}

export interface VerteilErgebnis {
  geaendert: Einheit[]; // nur Einheiten, die sich tatsächlich verändert haben
  ueberzaehlig: number; // Plan-Einheiten ohne freien Termin
  ohneInhalt: number; // freie Termine ohne Plan-Inhalt
}

/**
 * Verteilt den Plan (Blöcke) auf die noch offenen Termine in Datumsreihenfolge.
 * Bereits gehaltene Einheiten und fixierte Einheiten bleiben unangetastet, verbrauchen aber ihren Block-Anteil.
 */
export function verteile(einheiten: Einheit[], bloecke: PlanBlock[]): VerteilErgebnis {
  const seq = sequenz(bloecke);
  const verbraucht = einheiten.filter(
    (e) => e.blockId && (e.status === 'gehalten' || (e.status === 'geplant' && e.fixiert)),
  );
  for (const e of verbraucht) {
    const idx = seq.findIndex((s) => s.blockId === e.blockId);
    if (idx >= 0) seq.splice(idx, 1);
  }
  const offen = einheiten
    .filter((e) => e.status === 'geplant' && !e.fixiert)
    .sort((a, b) => a.datum.localeCompare(b.datum));

  const geaendert: Einheit[] = [];
  let ohneInhalt = 0;
  offen.forEach((e, i) => {
    const s = seq[i];
    const neu = s
      ? { blockId: s.blockId, lernbereichId: s.lernbereichId, istPuffer: s.istPuffer }
      : { blockId: null, lernbereichId: null, istPuffer: false };
    if (!s) ohneInhalt++;
    if (e.blockId !== neu.blockId || e.lernbereichId !== neu.lernbereichId || e.istPuffer !== neu.istPuffer) {
      geaendert.push({ ...e, ...neu });
    }
  });
  return { geaendert, ueberzaehlig: Math.max(0, seq.length - offen.length), ohneInhalt };
}

export type NachAusfall = 'verwerfen' | 'nachruecken' | 'puffer';

/**
 * Was passiert mit dem Inhalt einer ausgefallenen Einheit?
 * - verwerfen: der Block wird um eine Einheit kürzer
 * - puffer: die nächste Pufferstunde im Plan wird aufgebraucht, der Rest bleibt im Takt
 * - nachruecken: der Plan bleibt, alles rutscht einen Termin nach hinten
 * Gibt die geänderten Blöcke zurück.
 */
export function bloeckeNachAusfall(
  bloecke: PlanBlock[],
  einheit: Pick<Einheit, 'blockId'>,
  aktion: NachAusfall,
): PlanBlock[] {
  if (aktion === 'nachruecken') return [];
  const sortiert = [...bloecke].sort((a, b) => a.sortierung - b.sortierung);
  const eigener = sortiert.find((b) => b.id === einheit.blockId);
  if (aktion === 'verwerfen') {
    return eigener && eigener.anzahl > 0 ? [{ ...eigener, anzahl: eigener.anzahl - 1 }] : [];
  }
  const ab = eigener ? eigener.sortierung : -Infinity;
  const puffer =
    sortiert.find((b) => b.lernbereichId === null && b.anzahl > 0 && b.sortierung >= ab) ??
    sortiert.find((b) => b.lernbereichId === null && b.anzahl > 0);
  return puffer ? [{ ...puffer, anzahl: puffer.anzahl - 1 }] : [];
}

/** Zählt Unterrichtsstunden (Ustd., eine Einheit = Doppelstunde = 2 Ustd.) pro Lernbereich ('puffer' für Puffer). */
export function zaehleUstd(einheiten: Einheit[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of einheiten) {
    if (e.status !== 'geplant' && e.status !== 'gehalten') continue;
    const key = e.istPuffer ? 'puffer' : e.lernbereichId ?? 'ohne';
    m.set(key, (m.get(key) ?? 0) + 2);
  }
  return m;
}

/** Wie viele Pufferstunden (Einheiten) sind noch im offenen Plan? */
export function offenePuffer(einheiten: Einheit[]): number {
  return einheiten.filter((e) => e.status === 'geplant' && e.istPuffer).length;
}

/** Die letzte gehaltene (oder als Vertretung/Ausfall dokumentierte) Einheit vor oder an einem Datum. */
export function letzteEinheitBis(einheiten: Einheit[], bis: Datum): Einheit | undefined {
  return einheiten
    .filter((e) => e.datum <= bis && e.status === 'gehalten')
    .sort((a, b) => b.datum.localeCompare(a.datum))[0];
}

export function einheitNachDatum(einheiten: Einheit[]): Einheit[] {
  return [...einheiten].sort((a, b) => a.datum.localeCompare(b.datum));
}

export function wochenImZeitraum(von: Datum, bis: Datum): number {
  return Math.floor(tageZwischen(wochenStart(von), wochenStart(bis)) / 7) + 1;
}

export { fromYmd };
