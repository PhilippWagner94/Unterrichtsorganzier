import type { Entwurf, MethodischeReihe, Spiel, Test } from '../db/types';

type Zeilen = Record<string, Record<string, unknown>[]>;

/** Erzeugt aus dem Material-Export ein gut lesbares PDF (Spiele, Reihen, Entwürfe, Tests). */
export async function materialAlsPdf(tabellen: Zeilen): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const B = 210, R = 16, breite = B - 2 * R;
  let y = 18;

  const neueSeite = () => { pdf.addPage(); y = 18; };
  const platz = (h: number) => { if (y + h > 285) neueSeite(); };
  function text(t: string, groesse = 10, fett = false, einzug = 0) {
    if (!t.trim()) return;
    pdf.setFont('helvetica', fett ? 'bold' : 'normal');
    pdf.setFontSize(groesse);
    const zeilen: string[] = pdf.splitTextToSize(t, breite - einzug);
    const h = groesse * 0.42;
    for (const z of zeilen) { platz(h + 1); pdf.text(z, R + einzug, y); y += h + 0.9; }
  }
  const abstand = (mm = 3) => { y += mm; };
  const kopf = (t: string) => { platz(20); abstand(4); text(t, 15, true); pdf.setDrawColor(150); pdf.line(R, y, B - R, y); abstand(3); };
  const feld = (name: string, wert?: unknown) => { const v = wert == null ? '' : String(wert); if (v.trim()) { text(name, 9, true); text(v, 10, false, 2); } };

  const spiele = (tabellen.spiele ?? []) as unknown as Spiel[];
  const reihen = (tabellen.reihen ?? []) as unknown as MethodischeReihe[];
  const entwuerfe = (tabellen.entwuerfe ?? []) as unknown as Entwurf[];
  const tests = (tabellen.tests ?? []) as unknown as Test[];
  const reihenName = (id: string) => reihen.find((r) => r.id === id)?.thema ?? '';
  const spielName = (id: string) => spiele.find((s) => s.id === id)?.titel ?? '';

  text('Unterrichtsmaterial', 22, true);
  text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, 9);

  if (spiele.length) {
    kopf(`Spiele (${spiele.length})`);
    for (const s of [...spiele].sort((a, b) => a.titel.localeCompare(b.titel, 'de'))) {
      platz(30); abstand(2);
      text(s.titel, 12, true);
      const info = [s.dauerMin ? `${s.dauerMin} min` : '', s.gruppeMin || s.gruppeMax ? `${s.gruppeMin ?? ''}–${s.gruppeMax ?? ''} Kinder` : '', s.ort === 'halle' ? 'Halle' : s.ort === 'draussen' ? 'Draußen' : 'Halle/Draußen', (s.ziele ?? []).join(', ')].filter(Boolean).join(' · ');
      text(info, 8.5);
      feld('Material', s.material);
      feld('Ablauf', s.beschreibung);
      feld('Mögliche Variationen', s.variationen);
      feld('Quelle', s.quelle);
    }
  }
  if (reihen.length) {
    kopf(`Methodische Reihen (${reihen.length})`);
    for (const r of [...reihen].sort((a, b) => a.thema.localeCompare(b.thema, 'de'))) {
      platz(30); abstand(2);
      text(r.thema, 12, true);
      (r.schritte ?? []).forEach((st, i) => { text(`${i + 1}. ${st.titel}`, 10, true, 2); text(st.beschreibung, 10, false, 6); });
      feld('Sicherheit', r.sicherheit);
      feld('Quelle', r.quelle);
    }
  }
  if (entwuerfe.length) {
    kopf(`Stundenentwürfe (${entwuerfe.length})`);
    for (const e of [...entwuerfe].sort((a, b) => a.titel.localeCompare(b.titel, 'de'))) {
      platz(30); abstand(2);
      text(`${e.titel || 'Ohne Titel'}${e.klassenstufe ? ` (Klasse ${e.klassenstufe})` : ''}`, 12, true);
      feld('Aufwärmen', e.aufwaermen);
      feld('Hauptteil', e.hauptteil);
      feld('Ausklang', e.ausklang);
      feld('Material', e.material);
      feld('Wetteralternative', e.wetterAlternative);
      feld('Spiele', (e.spielIds ?? []).map(spielName).filter(Boolean).join(', '));
      feld('Methodische Reihen', (e.reiheIds ?? []).map(reihenName).filter(Boolean).join(', '));
    }
  }
  if (tests.length) {
    kopf(`Tests (${tests.length})`);
    for (const t of [...tests].sort((a, b) => a.name.localeCompare(b.name, 'de'))) {
      platz(25); abstand(2);
      text(`${t.name}${t.einheit ? ` (${t.einheit})` : ''}`, 12, true);
      feld('Beschreibung', t.beschreibung);
      if (t.tabelle?.length) {
        text('Bewertungstabelle', 9, true);
        for (const z of t.tabelle) text(`Klasse ${z.klassenstufe} · ${z.geschlecht === 'alle' ? 'alle' : z.geschlecht} · ${t.richtung === 'min' ? 'bis' : 'ab'} ${z.grenze} → Note ${z.note}`, 9, false, 2);
      }
    }
  }
  return pdf.output('blob');
}
