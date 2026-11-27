// Grobfahrplan-Vorschlag: Reihenfolge der Lernbereiche im Schuljahr (Sport, Doppelstunde pro Woche).
// Idee: Draußen-Themen (Leichtathletik, Spiele) im Spätsommer/Herbst und Frühjahr/Frühsommer,
// Turnen und Gymnastik/Tanz in der kalten Jahreszeit in der Halle. Die Anteile gelten für die jeweilige Klassenstufe,
// die Anzahl wird auf die tatsächlich vorhandenen Termine umgerechnet. Alles ist danach frei änderbar.

export interface GrobBlock {
  lernbereichId: string | null; // null = Puffer
  anzahl: number;
  hinweis: string;
}

interface Vorlage {
  key: string | null;
  gewicht: number;
  hinweis: string;
}

const LB = (k: string) => `lb-${k}`;

function vorlage(stufe: number): Vorlage[] {
  const klein = stufe <= 2;
  const la = klein ? 0.24 : 0.3;
  const sp = klein ? 0.24 : 0.19;
  const tu = klein ? 0.2 : 0.22;
  const gt = klein ? 0.14 : 0.1;
  return [
    { key: 'la', gewicht: la * 0.55, hinweis: 'Aug–Okt, draußen' },
    { key: 'sp', gewicht: sp * 0.5, hinweis: 'Okt, draußen/Halle' },
    { key: 'tu', gewicht: tu * 0.55, hinweis: 'Nov–Dez, Halle' },
    { key: null, gewicht: 0.05, hinweis: 'vor den Weihnachtsferien' },
    { key: 'gt', gewicht: gt, hinweis: 'Jan–Feb, Halle' },
    { key: 'tu', gewicht: tu * 0.45, hinweis: 'Feb–Mär, Halle' },
    { key: 'sp', gewicht: sp * 0.5, hinweis: 'Mär–Apr' },
    { key: 'la', gewicht: la * 0.45, hinweis: 'Apr–Jun, draußen' },
    { key: 'wb1', gewicht: 0.05, hinweis: 'Frühsommer, Natur' },
    { key: null, gewicht: 0.07, hinweis: 'Reserve zum Schuljahresende' },
  ];
}

/** Verteilt `termine` Einheiten nach Gewicht auf die Blöcke (Größtrest-Verfahren, jeder Block mind. 1). */
export function grobplanFuer(stufe: number, termine: number): GrobBlock[] {
  const v = vorlage(Math.min(4, Math.max(1, stufe)));
  const n = Math.max(v.length, termine);
  const summe = v.reduce((a, b) => a + b.gewicht, 0);
  const roh = v.map((b) => (b.gewicht / summe) * n);
  const anzahl = roh.map((r) => Math.max(1, Math.floor(r)));
  let rest = n - anzahl.reduce((a, b) => a + b, 0);
  const reihenfolge = roh.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; rest > 0; k = (k + 1) % reihenfolge.length, rest--) anzahl[reihenfolge[k].i]++;
  for (let k = 0; rest < 0 && k < 1000; k++) {
    const i = anzahl.indexOf(Math.max(...anzahl));
    if (anzahl[i] > 1) { anzahl[i]--; rest++; }
  }
  return v.map((b, i) => ({ lernbereichId: b.key ? LB(b.key) : null, anzahl: anzahl[i], hinweis: b.hinweis }));
}
