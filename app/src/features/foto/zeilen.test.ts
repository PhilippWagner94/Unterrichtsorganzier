import { describe, expect, it } from 'vitest';
import { alsSchritte, bereinige, titelUndRest } from './zeilen';

describe('OCR-Text', () => {
  it('löst Silbentrennung und überflüssige Leerzeilen', () => {
    expect(bereinige('Die  Kinder lau-\nfen los\n\n\n\nEnde ')).toBe('Die Kinder laufen los\n\nEnde');
  });
  it('trennt Titel und Rest', () => {
    expect(titelUndRest('\nFangspiel\nAlle rennen')).toEqual({ titel: 'Fangspiel', rest: 'Alle rennen' });
  });
  it('erkennt nummerierte Schritte und Folgezeilen', () => {
    const s = alsSchritte('1. Rolle vorwärts\nauf der Matte\n2) Handstand\n- Kerze');
    expect(s).toHaveLength(3);
    expect(s[0].titel).toBe('Rolle vorwärts');
    expect(s[0].beschreibung).toContain('auf der Matte');
    expect(s[2].titel).toBe('Kerze');
  });
});

import { stundeAusText } from './zeilen';
describe('Stunde aus Text', () => {
  it('teilt nach Überschriften auf', () => {
    const t = stundeAusText('Staffelspiele\nAufwärmen: Fangspiel\nlocker laufen\nHauptteil\nStaffeln mit Ball\nAusklang: Dehnen\nMaterial: Bälle, Hütchen');
    expect(t.titel).toBe('Staffelspiele');
    expect(t.aufwaermen).toBe('Fangspiel\nlocker laufen');
    expect(t.hauptteil).toBe('Staffeln mit Ball');
    expect(t.ausklang).toBe('Dehnen');
    expect(t.material).toBe('Bälle, Hütchen');
  });
  it('ohne Überschriften alles in den Hauptteil', () => {
    expect(stundeAusText('Nur Text\nzweite Zeile').hauptteil).toBe('Nur Text\nzweite Zeile');
  });
});
