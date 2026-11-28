import { describe, expect, it } from 'vitest';
import { parseDatum, parseSchuelerZeilen } from './schuelerImport';

describe('Schülerliste einlesen', () => {
  it('liest Datum in deutscher und ISO-Schreibweise', () => {
    expect(parseDatum('4.3.2018')).toBe('2018-03-04');
    expect(parseDatum('2018-03-04')).toBe('2018-03-04');
    expect(parseDatum('31.02.2018')).toBeUndefined();
    expect(parseDatum('abc')).toBeUndefined();
  });
  it('liest Zeilen mit optionalem Geschlecht und meldet Fehler', () => {
    const r = parseSchuelerZeilen('Müller; Lea; 04.03.2018; w\nKoch;Ben;12.12.2017\n\nOhne Datum;X\nFehler; Max; 99.99.2018');
    expect(r.ok).toEqual([
      { vorname: 'Lea', nachname: 'Müller', geburtsdatum: '2018-03-04', geschlecht: 'w' },
      { vorname: 'Ben', nachname: 'Koch', geburtsdatum: '2017-12-12', geschlecht: undefined },
    ]);
    expect(r.fehler).toHaveLength(2);
    expect(r.fehler[0]).toContain('Zeile 4');
  });
});
