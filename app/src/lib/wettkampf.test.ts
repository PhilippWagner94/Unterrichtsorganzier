import { describe, expect, it } from 'vitest';
import { einverstaendnisAbgleichen, frueherePunkte, offeneWettkampfPunkte, wettkampfKopieren } from './wettkampf';
import type { Wettkampf } from '../db/types';

const w = (id: string, extra: Partial<Wettkampf> = {}): Wettkampf => ({ id, name: id, datum: '2026-12-10', ort: '', notizen: '', klassenstufen: [4], teilnahme: 'kinder', schuelerIds: [], checkliste: [], ...extra });

describe('Wettkampf', () => {
  it('legt pro Kind einen Einverständnis-Punkt an und behält erledigte', () => {
    const a = einverstaendnisAbgleichen([], ['a', 'b'], 'kinder');
    expect(a).toHaveLength(2);
    a[0].erledigt = true;
    const b = einverstaendnisAbgleichen(a, ['a'], 'kinder');
    expect(b).toHaveLength(1);
    expect(b[0].erledigt).toBe(true);
    expect(einverstaendnisAbgleichen(a, ['a', 'b'], 'lehrkraft')).toHaveLength(0);
  });
  it('kopiert mit zurückgesetzten Haken', () => {
    const k = wettkampfKopieren(w('x', { checkliste: [{ text: 'Bus', erledigt: true }] }), 'y');
    expect(k.id).toBe('y');
    expect(k.checkliste[0].erledigt).toBe(false);
  });
  it('sammelt frühere Punkte nach Häufigkeit', () => {
    const l = [w('1', { checkliste: [{ text: 'Bus', erledigt: false }, { text: 'Anmeldung', erledigt: false }] }), w('2', { checkliste: [{ text: 'Bus', erledigt: true }, { text: 'Einverständnis', erledigt: false, schuelerId: 's' }] })];
    expect(frueherePunkte(l)).toEqual(['Bus', 'Anmeldung']);
  });
  it('nur Wettkämpfe im Monat mit offenen Punkten', () => {
    const l = [w('1', { checkliste: [{ text: 'a', erledigt: false }] }), w('2', { datum: '2027-03-01', checkliste: [{ text: 'a', erledigt: false }] }), w('3', { checkliste: [{ text: 'a', erledigt: true }] })];
    expect(offeneWettkampfPunkte(l, '2026-11-28', '2026-12-29').map((x) => x.w.id)).toEqual(['1']);
  });
});
