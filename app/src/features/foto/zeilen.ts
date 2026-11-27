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

export interface StundenTeile {
  titel: string;
  aufwaermen: string;
  hauptteil: string;
  ausklang: string;
  material: string;
  ort: string;
  wetterAlternative: string;
  notizen: string;
  reflexion: string;
}

export const LEERE_TEILE: StundenTeile = { titel: '', aufwaermen: '', hauptteil: '', ausklang: '', material: '', ort: '', wetterAlternative: '', notizen: '', reflexion: '' };

const KOPF = /^\s*(thema|titel|aufw(?:ä|ae|a)rmen|erw(?:ä|ae|a)rmung|einstieg|hauptteil(?:\s*\d)?|hauptteil|ausklang|abschluss|cool[- ]?down|material|ger(?:ä|ae|a)te|ort|wetter(?:alternative)?|notizen?|bemerkungen?|reflexion)\s*[:\-–]\s*(.*)$/i;
const KOPF_OHNE_DOPPELPUNKT = /^\s*(aufw(?:ä|ae|a)rmen|erw(?:ä|ae|a)rmung|einstieg|hauptteil(?:\s*\d)?|ausklang|abschluss|cool[- ]?down|material|ger(?:ä|ae|a)te|reflexion)\s*$/i;

function feld(k: string): keyof StundenTeile {
  const s = k.toLowerCase();
  if (s.startsWith('thema') || s.startsWith('titel')) return 'titel';
  if (s.startsWith('aufw') || s.startsWith('erw') || s.startsWith('einstieg')) return 'aufwaermen';
  if (s.startsWith('haupt')) return 'hauptteil';
  if (s.startsWith('ausk') || s.startsWith('absch') || s.startsWith('cool')) return 'ausklang';
  if (s.startsWith('mat') || s.startsWith('ger')) return 'material';
  if (s.startsWith('ort')) return 'ort';
  if (s.startsWith('wetter')) return 'wetterAlternative';
  if (s.startsWith('refl')) return 'reflexion';
  return 'notizen';
}

/** Teilt erkannten Text einer Stundenplanung anhand von Überschriften (Aufwärmen, Hauptteil, Ausklang, Material …) auf. Ohne Überschriften landet alles im Hauptteil. */
export function stundeAusText(text: string): StundenTeile {
  const t: StundenTeile = { ...LEERE_TEILE };
  let aktuell: keyof StundenTeile | null = null;
  let gefunden = false;
  const vorspann: string[] = [];
  const add = (f: keyof StundenTeile, z: string) => { t[f] = t[f] ? `${t[f]}\n${z}` : z; };
  for (const zeile of text.split('\n')) {
    const m = zeile.match(KOPF);
    const m2 = !m ? zeile.match(KOPF_OHNE_DOPPELPUNKT) : null;
    if (m || m2) {
      gefunden = true;
      aktuell = feld((m ?? m2)![1]);
      const rest = (m?.[2] ?? '').trim();
      if (rest) add(aktuell, rest);
      continue;
    }
    if (!zeile.trim()) continue;
    if (aktuell) add(aktuell, zeile.trim());
    else vorspann.push(zeile.trim());
  }
  if (!gefunden) return { ...LEERE_TEILE, hauptteil: vorspann.join('\n') };
  if (vorspann.length) {
    if (!t.titel) t.titel = vorspann[0];
    if (vorspann.length > 1) t.notizen = [vorspann.slice(1).join('\n'), t.notizen].filter(Boolean).join('\n');
  }
  return t;
}
