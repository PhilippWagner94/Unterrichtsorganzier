import type { CheckPunkt, Schueler, Wettkampf } from '../db/types';

export const EINVERSTAENDNIS = 'Einverständnis';

/** Gleicht die Einverständnis-Punkte mit den teilnehmenden Kindern ab (erledigte Punkte bleiben erhalten). */
export function einverstaendnisAbgleichen(checkliste: CheckPunkt[], schuelerIds: string[], teilnahme: Wettkampf['teilnahme']): CheckPunkt[] {
  const soll = teilnahme === 'kinder' ? schuelerIds : [];
  const behalten = checkliste.filter((p) => !p.schuelerId || soll.includes(p.schuelerId));
  const vorhanden = new Set(behalten.filter((p) => p.schuelerId).map((p) => p.schuelerId));
  const neu = soll.filter((id) => !vorhanden.has(id)).map((id) => ({ text: EINVERSTAENDNIS, erledigt: false, schuelerId: id }));
  return [...behalten, ...neu];
}

/** Kopie eines Wettkampfs: Haken zurückgesetzt, Datum bleibt zum Anpassen. */
export function wettkampfKopieren(w: Wettkampf, neueId: string): Wettkampf {
  return { ...w, id: neueId, name: `${w.name} (Kopie)`, checkliste: w.checkliste.map((p) => ({ ...p, erledigt: false })) };
}

/** Häufig verwendete Punkte aus früheren Wettkämpfen (ohne Kind-Punkte), nach Häufigkeit sortiert. */
export function frueherePunkte(alle: Wettkampf[], ausser?: string): string[] {
  const z = new Map<string, number>();
  for (const w of alle) {
    if (w.id === ausser) continue;
    for (const p of w.checkliste) if (!p.schuelerId && p.text.trim()) z.set(p.text.trim(), (z.get(p.text.trim()) ?? 0) + 1);
  }
  return [...z.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de')).map(([t]) => t);
}

export const STANDARD_PUNKTE = ['Anmeldung', 'Busbuchung', 'Elterninfo / Einverständnis', 'Treffzeit mitteilen', 'Verpflegung', 'Erste-Hilfe-Set', 'Startliste / Urkunden'];

/** Offene Punkte (für Heute und Aufgaben): Wettkämpfe der nächsten `tage` Tage mit unerledigten Punkten. */
export function offeneWettkampfPunkte(alle: Wettkampf[], heute: string, bis: string) {
  return alle
    .filter((w) => w.datum >= heute && w.datum <= bis)
    .map((w) => ({ w, offen: w.checkliste.filter((p) => !p.erledigt) }))
    .filter((x) => x.offen.length > 0)
    .sort((a, b) => a.w.datum.localeCompare(b.w.datum));
}

export const kindName = (s: Pick<Schueler, 'vorname' | 'nachname'> | undefined) => (s ? `${s.vorname} ${s.nachname}`.trim() : '?');
