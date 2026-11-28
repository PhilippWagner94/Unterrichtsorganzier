import type { Spiel } from '../db/types';

/** Feste, übersichtliche Schlagwortliste für die Spielebibliothek. */
export const SPIEL_TAGS: [string, RegExp][] = [
  ['Aufwärmen', /aufw[äa]rm/],
  ['Ballspiel', /ball|werf|wurf|treff|volley|faust/],
  ['Fußball', /fu(ß|ss)ball|dribbel/],
  ['Basketball', /basketball/],
  ['Fangspiel', /fang|fänger|jagd|verfolg/],
  ['Laufspiel', /lauf|renn|staffel|sprint|schnell/],
  ['Kooperation', /kooperation|vertrauen|team|gruppe|partner|gemeinschaft|zusammen|blind/],
  ['Kennenlernen', /kennenlern|namens|eisbrecher|kontakt|begrüß/],
  ['Kraft & Kämpfen', /kraft|kampf|kämpf|ring|zieh|schieb|raufen/],
  ['Geschicklichkeit', /geschick|koordination|balanc|gleichgewicht/],
  ['Denken & Reagieren', /denk|reaktion|konzentration|orientier|wahrnehm|merk/],
  ['Freizeitspiele', /freizeit|frisbee|indiaca|federball|golf/],
  ['Rhythmus & Darstellen', /rhythm|tanz|musik|theater|gestalt|darstell/],
  ['Entspannung', /entspann|ruhe|massage|fantasie/],
];

export const TAG_NAMEN = SPIEL_TAGS.map(([n]) => n);

/** Fasst beliebige Schlagwörter zu den festen Schlagwörtern zusammen (Unpassendes entfällt). */
export function kanonischeTags(roh: string[]): string[] {
  const text = roh.map((t) => t.toLowerCase());
  return SPIEL_TAGS.filter(([, re]) => text.some((t) => re.test(t))).map(([n]) => n);
}

/** Importierte Sammlungs-Spiele bekommen aufgeräumte Schlagwörter (selbst angelegte bleiben unberührt). */
export const istSammlungsSpiel = (s: Pick<Spiel, 'quelle'>) => s.quelle.startsWith('Kleine Spiele-Sammlung');

export function spielMitKanonischenTags<T extends Spiel>(s: T): T {
  if (!istSammlungsSpiel(s)) return s;
  const tags = kanonischeTags([...s.ziele, s.titel]);
  return { ...s, ziele: tags.length ? tags : s.ziele.length ? ['Ballspiel'].filter(() => /ball/i.test(s.titel)) : [] };
}
