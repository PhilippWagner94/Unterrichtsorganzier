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
 * Liest eine Liste von Kindern, eine Zeile pro Kind: `Name; Vorname; TT.MM.JJJJ; w` (Trennzeichen ; oder Tab,
 * Geschlecht optional). Gibt gültige Kinder und Fehlermeldungen pro Zeile zurück.
 */
export function parseSchuelerZeilen(text: string): { ok: NeuerSchueler[]; fehler: string[] } {
  const ok: NeuerSchueler[] = [];
  const fehler: string[] = [];
  text.split(/\r?\n/).forEach((zeile, i) => {
    if (!zeile.trim()) return;
    const teile = zeile.split(/[;\t]/).map((t) => t.trim());
    if (teile.length < 3) {
      fehler.push(`Zeile ${i + 1}: Name; Vorname; Geburtsdatum erwartet`);
      return;
    }
    const [nachname, vorname, datum, g] = teile;
    const geburtsdatum = parseDatum(datum);
    if (!vorname || !nachname) fehler.push(`Zeile ${i + 1}: Vor- oder Nachname fehlt`);
    else if (!geburtsdatum) fehler.push(`Zeile ${i + 1}: Geburtsdatum „${datum}“ nicht lesbar (TT.MM.JJJJ)`);
    else ok.push({ vorname, nachname, geburtsdatum, geschlecht: parseGeschlecht(g) });
  });
  return { ok, fehler };
}

const DATUM_IM_TEXT = /(\d{1,2})\s*[.,]\s*(\d{1,2})\s*[.,]\s*(\d{4})/;

/**
 * Wandelt frei erkannten Text (z. B. aus einem Foto einer Klassenliste) in Zeilen
 * `Name; Vorname; TT.MM.JJJJ; Geschlecht`. Erkennt „Name, Vorname“ und „Vorname Name“, ein
 * Geburtsdatum irgendwo in der Zeile und ein einzelnes w/m/d danach. Führende Nummern („1.“) fallen weg.
 * Zeilen ohne Datum bleiben mit Hinweis stehen, damit man sie von Hand ergänzen kann.
 */
export function schuelerAusFreitext(text: string): string {
  const zeilen: string[] = [];
  for (const roh of text.split(/\r?\n/)) {
    let z = roh.replace(/[|_]/g, ' ').replace(/^\s*\d{1,2}\s*[.)]\s+/, '').trim();
    if (!z) continue;
    const m = z.match(DATUM_IM_TEXT);
    let datum = '';
    let davor = z;
    let danach = '';
    if (m) {
      datum = `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}.${m[3]}`;
      davor = z.slice(0, m.index).trim();
      danach = z.slice((m.index ?? 0) + m[0].length).trim();
    }
    davor = davor.replace(/[;\t]+/g, ' ').replace(/\s+/g, ' ').replace(/[^\p{L}\s,'-]/gu, '').trim();
    let vor = '';
    let nach = '';
    if (davor.includes(',')) {
      const [a, ...b] = davor.split(',');
      nach = a.trim();
      vor = b.join(' ').trim();
    } else {
      const t = davor.split(' ');
      vor = t[0] ?? '';
      nach = t.slice(1).join(' ');
    }
    if (!vor && !nach) continue;
    const g = (danach.match(/\b([wmd])\b/i)?.[1] ?? '').toLowerCase();
    zeilen.push([nach, vor, datum, g].join('; ').replace(/;\s*$/, '').replace(/;\s*$/, ''));
  }
  return zeilen.join('\n');
}
