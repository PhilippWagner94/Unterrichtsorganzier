import type { Geschlecht, Schueler } from '../db/types';
import { istGueltig } from './dates';

export type NeuerSchueler = Pick<Schueler, 'vorname' | 'nachname' | 'geburtsdatum' | 'geschlecht'>;

/** '24.12.2017' oder '2017-12-24' → '2017-12-24'; sonst undefined */
export function parseDatum(text: string): string | undefined {
  const t = text.trim();
  const m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const iso = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : t;
  return istGueltig(iso) ? iso : undefined;
}

function parseGeschlecht(text: string | undefined): Geschlecht | undefined {
  const t = (text ?? '').trim().toLowerCase();
  if (['w', 'weiblich', 'f', 'mädchen', 'maedchen'].includes(t)) return 'w';
  if (['m', 'männlich', 'maennlich', 'junge'].includes(t)) return 'm';
  if (['d', 'divers'].includes(t)) return 'd';
  return undefined;
}

/**
 * Liest eine Liste von Kindern, eine Zeile pro Kind: `Vorname; Name; TT.MM.JJJJ; w` (Trennzeichen ; oder Tab,
 * Geschlecht optional). Gibt gültige Kinder und Fehlermeldungen pro Zeile zurück.
 */
export function parseSchuelerZeilen(text: string): { ok: NeuerSchueler[]; fehler: string[] } {
  const ok: NeuerSchueler[] = [];
  const fehler: string[] = [];
  text.split(/\r?\n/).forEach((zeile, i) => {
    if (!zeile.trim()) return;
    const teile = zeile.split(/[;\t]/).map((t) => t.trim());
    if (teile.length < 3) {
      fehler.push(`Zeile ${i + 1}: Vorname; Name; Geburtsdatum erwartet`);
      return;
    }
    const [vorname, nachname, datum, g] = teile;
    const geburtsdatum = parseDatum(datum);
    if (!vorname || !nachname) fehler.push(`Zeile ${i + 1}: Vor- oder Nachname fehlt`);
    else if (!geburtsdatum) fehler.push(`Zeile ${i + 1}: Geburtsdatum „${datum}“ nicht lesbar (TT.MM.JJJJ)`);
    else ok.push({ vorname, nachname, geburtsdatum, geschlecht: parseGeschlecht(g) });
  });
  return { ok, fehler };
}
