import type { Ort, Spiel } from '../../db/types';

export interface SpielFilter {
  suche: string;
  ort: Ort | 'alle';
  nurFavoriten: boolean;
  tags: string[]; // alle gewählten Schlagwörter müssen zutreffen
}

/** Filtert Spiele nach Suchtext (Titel, Beschreibung, Material, Schlagwörter), Ort, Favorit und Schlagwort; Ergebnis alphabetisch. */
export function filterSpiele(spiele: Spiel[], f: SpielFilter): Spiel[] {
  const q = f.suche.trim().toLowerCase();
  return spiele
    .filter((s) => {
      if (f.nurFavoriten && !s.favorit) return false;
      if (f.ort !== 'alle' && s.ort !== f.ort && s.ort !== 'beides') return false;
      if (f.tags.some((t) => !s.ziele.includes(t))) return false;
      if (!q) return true;
      return [s.titel, s.beschreibung, s.material, ...s.ziele].some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
}

/** Alle vorkommenden Schlagwörter, sortiert. */
export function alleTags(spiele: Spiel[]): string[] {
  return [...new Set(spiele.flatMap((s) => s.ziele))].sort((a, b) => a.localeCompare(b, 'de'));
}
