import type { Einheit } from '../db/types';

const inhaltlich = (e: Einheit) => !!(e.titel || e.aufwaermen || e.hauptteil || e.ausklang || e.material || e.spielIds.length || e.reiheIds.length);

/**
 * Übernimmt Inhalte einer früheren Planung (z. B. letztes Jahr bei Klasse 3) in die neue:
 * je Lernbereich werden die Einheiten der Reihe nach zugeordnet. Es werden nur noch leere, geplante, nicht fixierte Ziel-Einheiten befüllt.
 * Reflexion und Notizen des Vorjahres erscheinen als Hinweis „Vorjahr: …“ in den Notizen.
 */
export function planeUebernahme(quelle: Einheit[], ziel: Einheit[]): Map<string, Partial<Einheit>> {
  const ergebnis = new Map<string, Partial<Einheit>>();
  const nachBereich = (l: Einheit[]) => {
    const m = new Map<string, Einheit[]>();
    for (const e of [...l].sort((a, b) => a.datum.localeCompare(b.datum))) {
      if (e.istPuffer || !e.lernbereichId) continue;
      m.set(e.lernbereichId, [...(m.get(e.lernbereichId) ?? []), e]);
    }
    return m;
  };
  const q = nachBereich(quelle.filter((e) => e.status !== 'ausfall' && e.status !== 'verschoben' && inhaltlich(e)));
  const z = nachBereich(ziel.filter((e) => e.status === 'geplant' && !e.fixiert && !inhaltlich(e)));
  for (const [lb, quellen] of q) {
    const ziele = z.get(lb) ?? [];
    quellen.slice(0, ziele.length).forEach((s, i) => {
      const hinweis = [s.reflexion, s.notizen].map((x) => x.trim()).filter(Boolean).join('\n');
      ergebnis.set(ziele[i].id, {
        titel: s.titel, zielIds: s.zielIds, spielIds: s.spielIds, reiheIds: s.reiheIds, aufwaermen: s.aufwaermen, hauptteil: s.hauptteil,
        ausklang: s.ausklang, material: s.material, ort: s.ort, wetterAlternative: s.wetterAlternative,
        ...(hinweis ? { notizen: `${ziele[i].notizen ? ziele[i].notizen + '\n\n' : ''}Vorjahr: ${hinweis}` } : {}),
      });
    });
  }
  return ergebnis;
}
