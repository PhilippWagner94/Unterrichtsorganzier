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
