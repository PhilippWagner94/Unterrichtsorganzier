import { describe, expect, it } from 'vitest';
import { formatWert, fortschritt, juengstePro, juengstes } from './auswertung';
import type { Testergebnis } from '../../db/types';

const erg = (id: string, schuelerId: string, datum: string, wert?: number): Testergebnis => ({ id, testId: 't', schuelerId, datum, wert });

describe('Auswertung', () => {
  it('findet das jüngste Ergebnis', () => {
    expect(juengstes([erg('a', 's', '2026-09-01', 1), erg('b', 's', '2026-11-01', 2)])?.id).toBe('b');
    expect(juengstes([])).toBeUndefined();
  });
  it('gruppiert das jüngste Ergebnis je Kind', () => {
    const m = juengstePro(
      [erg('a', 's1', '2026-09-01', 1), erg('b', 's1', '2026-11-01', 2), erg('c', 's2', '2026-10-01', 3)],
      (e) => e.schuelerId,
    );
    expect(m.get('s1')?.id).toBe('b');
    expect(m.get('s2')?.id).toBe('c');
  });
  it('berechnet den Fortschritt je nach Richtung', () => {
    const l = [erg('a', 's', '2026-09-01', 10.4), erg('b', 's', '2026-11-01', 9.9)];
    expect(fortschritt({ richtung: 'min' }, l)).toBe(0.5); // schneller = besser
    expect(fortschritt({ richtung: 'max' }, l)).toBe(-0.5);
    expect(fortschritt({ richtung: 'min' }, [l[0]])).toBeUndefined();
  });
  it('formatiert Werte mit Komma', () => {
    expect(formatWert(9.5, 's')).toBe('9,5 s');
    expect(formatWert(12)).toBe('12');
    expect(formatWert(undefined)).toBe('–');
  });
});
