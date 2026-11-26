import { describe, expect, it } from 'vitest';
import { addTage, formatLang, istGueltig, tageZwischen, wochentag } from './dates';
import { klassenstufe, klassenstufeAm, schuljahrStartjahr, istAktiv } from './schuljahr';
import { geburtstageZwischen, geburtstagImJahr } from './geburtstage';
import { bussUndBettag, feiertageSachsen, ostersonntag } from './feiertage';
import { bloeckeNachAusfall, leereEinheit, sequenz, terminSlots, verteile, zaehleUstd } from './plan';
import { bestleistung, durchschnitt, noteFuerWert } from './noten';
import type { Einheit, FreierTag, Klasse, PlanBlock, Schueler, Schuljahr, Test } from '../db/types';

const kind = (id: string, geb: string): Schueler => ({
  id,
  klasseId: 'k',
  vorname: id,
  nachname: 'X',
  geburtsdatum: geb,
});

describe('Datum', () => {
  it('rechnet Wochentage und Abstände', () => {
    expect(wochentag('2026-11-26')).toBe(4); // Donnerstag
    expect(addTage('2026-12-31', 1)).toBe('2027-01-01');
    expect(tageZwischen('2026-11-01', '2026-11-26')).toBe(25);
    expect(formatLang('2026-11-26')).toBe('Do, 26.11.2026');
  });
  it('erkennt ungültige Daten', () => {
    expect(istGueltig('2026-02-30')).toBe(false);
    expect(istGueltig('2026-02-28')).toBe(true);
    expect(istGueltig('abc')).toBe(false);
  });
});

describe('Klassenstufe', () => {
  it('berechnet die Stufe aus dem Einschulungsjahr', () => {
    const k = { einschulungsjahr: 2023 };
    expect(klassenstufe(k, 2023)).toBe(1);
    expect(klassenstufe(k, 2026)).toBe(4);
  });
  it('Schuljahr beginnt im August', () => {
    expect(schuljahrStartjahr('2026-07-31')).toBe(2025);
    expect(schuljahrStartjahr('2026-08-01')).toBe(2026);
    expect(schuljahrStartjahr('2026-11-26')).toBe(2026);
    expect(klassenstufeAm({ einschulungsjahr: 2025 }, '2026-07-15')).toBe(1);
    expect(klassenstufeAm({ einschulungsjahr: 2025 }, '2026-08-20')).toBe(2);
  });
  it('rückt Klassen automatisch hoch und archiviert nach Stufe 4', () => {
    const k: Klasse = {
      id: 'a',
      name: '4a',
      einschulungsjahr: 2023,
      wochentag: 1,
      zusatzAktiv: false,
      zusatzWochentag: 3,
      archiviert: false,
    };
    expect(istAktiv(k, '2026-11-26')).toBe(true);
    expect(istAktiv(k, '2027-08-15')).toBe(false); // Stufe 5
    expect(istAktiv({ ...k, archiviert: true }, '2026-11-26')).toBe(false);
  });
});

describe('Geburtstage seit der letzten Einheit', () => {
  const liste = [
    kind('Anna', '2017-12-24'), // in den Weihnachtsferien
    kind('Ben', '2016-11-27'),
    kind('Cleo', '2016-12-01'),
    kind('Dora', '2016-11-20'), // vor dem Zeitraum
    kind('Emil', '2016-01-05'),
  ];
  it('zählt Ferien mit', () => {
    const r = geburtstageZwischen(liste, '2026-12-17', '2027-01-07');
    expect(r.map((g) => g.schueler.vorname)).toEqual(['Anna', 'Emil']);
    expect(r[0].alter).toBe(9);
    expect(r[1].alter).toBe(11);
  });
  it('schließt den Starttag aus und den Endtag ein', () => {
    const r = geburtstageZwischen(liste, '2026-11-27', '2026-12-01');
    expect(r.map((g) => g.schueler.vorname)).toEqual(['Cleo']);
    const r2 = geburtstageZwischen(liste, '2026-11-26', '2026-11-27');
    expect(r2.map((g) => g.schueler.vorname)).toEqual(['Ben']);
  });
  it('findet nichts bei leerem Zeitraum', () => {
    expect(geburtstageZwischen(liste, '2026-11-26', '2026-11-26')).toEqual([]);
  });
  it('behandelt den 29. Februar', () => {
    expect(geburtstagImJahr('2016-02-29', 2027)).toBe('2027-02-28');
    expect(geburtstagImJahr('2016-02-29', 2028)).toBe('2028-02-29');
  });
});

describe('Feiertage Sachsen', () => {
  it('berechnet Ostern', () => {
    expect(ostersonntag(2026)).toBe('2026-04-05');
    expect(ostersonntag(2027)).toBe('2027-03-28');
  });
  it('berechnet den Buß- und Bettag', () => {
    expect(bussUndBettag(2026)).toBe('2026-11-18');
    expect(bussUndBettag(2027)).toBe('2027-11-17');
  });
  it('enthält die sächsischen Feiertage', () => {
    const f = feiertageSachsen(2026).map((x) => x.datum);
    expect(f).toContain('2026-04-03'); // Karfreitag
    expect(f).toContain('2026-04-06'); // Ostermontag
    expect(f).toContain('2026-05-14'); // Himmelfahrt
    expect(f).toContain('2026-05-25'); // Pfingstmontag
    expect(f).toContain('2026-10-31'); // Reformationstag
  });
});

const klasse: Klasse = {
  id: 'k1',
  name: '3a',
  einschulungsjahr: 2024,
  wochentag: 2, // Dienstag
  zusatzAktiv: false,
  zusatzWochentag: 4,
  archiviert: false,
};
const sj: Schuljahr = { id: 's1', name: '2026/27', start: '2026-11-23', ende: '2026-12-31' };

describe('Terminplanung', () => {
  it('erzeugt wöchentliche Termine und überspringt Ferien', () => {
    const freie: FreierTag[] = [
      { id: 'f', schuljahrId: 's1', von: '2026-12-21', bis: '2026-12-31', bezeichnung: 'Weihnachtsferien', art: 'ferien' },
    ];
    expect(terminSlots(klasse, sj, freie)).toEqual(['2026-11-24', '2026-12-01', '2026-12-08', '2026-12-15']);
  });
  it('überspringt gesetzliche Feiertage', () => {
    const sj2: Schuljahr = { ...sj, start: '2026-12-21', ende: '2027-01-12' };
    const k: Klasse = { ...klasse, wochentag: 5 }; // Freitag
    // 25.12. (Freitag) ist Feiertag, 01.01. (Freitag) ist Neujahr
    expect(terminSlots(k, sj2, [])).toEqual(['2027-01-08']);
  });
  it('legt die zusätzliche Doppelstunde nur alle zwei Wochen an', () => {
    const k: Klasse = { ...klasse, zusatzAktiv: true, zusatzWochentag: 4 };
    const slots = terminSlots(k, { ...sj, start: '2026-11-23', ende: '2026-12-18' }, []);
    const donnerstage = slots.filter((d) => wochentag(d) === 4);
    expect(donnerstage).toEqual(['2026-12-03', '2026-12-17']);
  });
});

function einheiten(daten: string[]): Einheit[] {
  return daten.map((d) => leereEinheit('k1', 's1', d));
}
const block = (id: string, lb: string | null, anzahl: number, sortierung: number): PlanBlock => ({
  id,
  klasseId: 'k1',
  schuljahrId: 's1',
  lernbereichId: lb,
  anzahl,
  sortierung,
});

describe('Jahresplan verteilen', () => {
  const bloecke = [block('b1', 'LA', 2, 1), block('b2', null, 1, 2), block('b3', 'TU', 2, 3)];
  it('verteilt Blöcke in Reihenfolge auf Termine', () => {
    expect(sequenz(bloecke).map((s) => s.lernbereichId)).toEqual(['LA', 'LA', null, 'TU', 'TU']);
    const e = einheiten(['2026-12-01', '2026-12-08', '2026-12-15', '2027-01-12', '2027-01-19', '2027-01-26']);
    const r = verteile(e, bloecke);
    expect(r.geaendert).toHaveLength(5);
    expect(r.ohneInhalt).toBe(1);
    expect(r.ueberzaehlig).toBe(0);
    expect(r.geaendert[2].istPuffer).toBe(true);
  });
  it('meldet überzählige Plan-Einheiten', () => {
    const r = verteile(einheiten(['2026-12-01', '2026-12-08']), bloecke);
    expect(r.ueberzaehlig).toBe(3);
  });
  it('gehaltene Einheiten verbrauchen ihren Block-Anteil und bleiben unverändert', () => {
    const e = einheiten(['2026-12-01', '2026-12-08', '2026-12-15', '2027-01-12']);
    e[0].status = 'gehalten';
    e[0].blockId = 'b1';
    e[0].lernbereichId = 'LA';
    const r = verteile(e, bloecke);
    const neu = new Map(r.geaendert.map((x) => [x.id, x]));
    expect(neu.has(e[0].id)).toBe(false);
    expect(neu.get(e[1].id)?.lernbereichId).toBe('LA'); // zweite LA-Einheit
    expect(neu.get(e[2].id)?.istPuffer).toBe(true);
    expect(neu.get(e[3].id)?.lernbereichId).toBe('TU');
  });
  it('ausgefallene Einheiten werden übersprungen, der Inhalt rückt nach', () => {
    const e = einheiten(['2026-12-01', '2026-12-08', '2026-12-15', '2027-01-12', '2027-01-19', '2027-01-26']);
    e[0].status = 'ausfall';
    const r = verteile(e, bloecke);
    const neu = new Map(r.geaendert.map((x) => [x.id, x]));
    expect(neu.get(e[1].id)?.lernbereichId).toBe('LA');
    expect(neu.has(e[0].id)).toBe(false);
    expect(r.ohneInhalt).toBe(0); // sechs Termine, einer ausgefallen: fünf offene Termine für fünf Inhalte
    expect(r.ueberzaehlig).toBe(0);
    // Fällt noch ein weiterer Termin aus, bleibt ein Inhalt ohne Termin
    e[1].status = 'ausfall';
    expect(verteile(e, bloecke).ueberzaehlig).toBe(1);
  });
  it('fixierte Einheiten werden nicht verschoben', () => {
    const e = einheiten(['2026-12-01', '2026-12-08', '2026-12-15']);
    e[1].fixiert = true;
    e[1].lernbereichId = 'LA';
    e[1].blockId = 'b1';
    const r = verteile(e, bloecke);
    expect(r.geaendert.find((x) => x.id === e[1].id)).toBeUndefined();
  });
  it('Ausfall: verwerfen kürzt den Block, Puffer nutzen verbraucht Puffer, nachrücken ändert nichts', () => {
    expect(bloeckeNachAusfall(bloecke, { blockId: 'b1' }, 'verwerfen')).toEqual([{ ...bloecke[0], anzahl: 1 }]);
    expect(bloeckeNachAusfall(bloecke, { blockId: 'b1' }, 'puffer')).toEqual([{ ...bloecke[1], anzahl: 0 }]);
    expect(bloeckeNachAusfall(bloecke, { blockId: 'b1' }, 'nachruecken')).toEqual([]);
  });
  it('zählt Unterrichtsstunden pro Lernbereich', () => {
    const e = einheiten(['2026-12-01', '2026-12-08', '2026-12-15']);
    e[0].lernbereichId = 'LA';
    e[1].lernbereichId = 'LA';
    e[2].istPuffer = true;
    e[2].status = 'ausfall';
    const m = zaehleUstd(e);
    expect(m.get('LA')).toBe(4);
    expect(m.get('puffer')).toBeUndefined();
  });
});

describe('Noten', () => {
  const sprint: Test = {
    id: 't',
    name: 'Sprint 50 m',
    typ: 'messwert',
    einheit: 's',
    richtung: 'min',
    beschreibung: '',
    tabelle: [
      { klassenstufe: 'alle', geschlecht: 'alle', grenze: 9.0, note: 1 },
      { klassenstufe: 'alle', geschlecht: 'alle', grenze: 10.0, note: 2 },
      { klassenstufe: 'alle', geschlecht: 'alle', grenze: 11.0, note: 3 },
      { klassenstufe: 4, geschlecht: 'w', grenze: 9.5, note: 1 },
      { klassenstufe: 4, geschlecht: 'w', grenze: 10.5, note: 2 },
    ],
  };
  it('wählt den spezifischsten Satz und die beste passende Note', () => {
    expect(noteFuerWert(sprint, 8.9, 3, 'm')).toBe(1);
    expect(noteFuerWert(sprint, 10.4, 3, 'm')).toBe(3);
    expect(noteFuerWert(sprint, 9.4, 4, 'w')).toBe(1);
    expect(noteFuerWert(sprint, 10.4, 4, 'w')).toBe(2);
    expect(noteFuerWert(sprint, 12, 3, 'm')).toBeUndefined();
  });
  it('größer-ist-besser funktioniert', () => {
    const weit: Test = {
      ...sprint,
      richtung: 'max',
      tabelle: [
        { klassenstufe: 'alle', geschlecht: 'alle', grenze: 3, note: 1 },
        { klassenstufe: 'alle', geschlecht: 'alle', grenze: 2, note: 2 },
      ],
    };
    expect(noteFuerWert(weit, 3.2, 3, undefined)).toBe(1);
    expect(noteFuerWert(weit, 2.4, 3, undefined)).toBe(2);
    expect(noteFuerWert(weit, 1.0, 3, undefined)).toBeUndefined();
  });
  it('Durchschnitt und Bestleistung', () => {
    expect(durchschnitt([1, 2, 2])).toBe(1.7);
    expect(durchschnitt([])).toBeUndefined();
    const erg = [
      { id: '1', testId: 't', schuelerId: 's', datum: '2026-09-01', wert: 10.2 },
      { id: '2', testId: 't', schuelerId: 's', datum: '2026-11-01', wert: 9.8 },
    ];
    expect(bestleistung({ richtung: 'min' }, erg)?.wert).toBe(9.8);
    expect(bestleistung({ richtung: 'max' }, erg)?.wert).toBe(10.2);
  });
});
