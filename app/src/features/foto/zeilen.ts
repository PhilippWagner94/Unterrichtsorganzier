import type { ReihenSchritt } from '../../db/types';

/** Bereinigt OCR-Text: Silbentrennung am Zeilenende lösen, Leerzeichen/Leerzeilen vereinheitlichen. */
export function bereinige(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2')
    .split('\n')
    .map((z) => z.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Erste nicht leere Zeile als Titel, der Rest als Text. */
export function titelUndRest(text: string): { titel: string; rest: string } {
  const zeilen = text.split('\n');
  const i = zeilen.findIndex((z) => z.trim() !== '');
  if (i < 0) return { titel: '', rest: '' };
  return { titel: zeilen[i].trim(), rest: zeilen.slice(i + 1).join('\n').trim() };
}

const NUMMER = /^\s*(?:\(?\d{1,2}[.)]|[-•*–]|Schritt\s*\d+[:.]?)\s+/i;

/** Teilt Text in Schritte: Zeilen mit „1.“, „2)“, „-“ oder „•“ beginnen einen neuen Schritt. */
export function alsSchritte(text: string): ReihenSchritt[] {
  const schritte: ReihenSchritt[] = [];
  for (const z of text.split('\n').map((x) => x.trim()).filter(Boolean)) {
    if (NUMMER.test(z) || schritte.length === 0) {
      const t = z.replace(NUMMER, '').trim();
      schritte.push({ titel: t.length > 40 ? t.slice(0, 40).trim() + ' …' : t, beschreibung: t.length > 40 ? t : '' });
    } else {
      const s = schritte[schritte.length - 1];
      s.beschreibung = (s.beschreibung ? s.beschreibung + ' ' : s.titel + ' ') + z;
      if (!s.beschreibung.startsWith(s.titel)) s.beschreibung = s.titel + ' ' + s.beschreibung;
    }
  }
  return schritte;
}
