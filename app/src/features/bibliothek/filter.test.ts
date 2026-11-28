import { describe, expect, it } from 'vitest';
import { alleTags, filterSpiele } from './filter';
import type { Spiel } from '../../db/types';

const spiel = (titel: string, extra: Partial<Spiel> = {}): Spiel => ({
  id: titel,
  titel,
  beschreibung: '',
  material: '',
  ort: 'beides',
  ziele: [],
  quelle: '',
  favorit: false,
  erstellt: 0,
  ...extra,
});

const liste = [
  spiel('Zweifelderball', { ort: 'halle', ziele: ['Ballspiel'], material: 'weiche Bälle' }),
  spiel('Schwarzer Mann', { ort: 'draussen', ziele: ['Fangspiel'], favorit: true }),
  spiel('Ampelspiel', { ziele: ['Aufwärmen', 'Fangspiel'], beschreibung: 'Rot Gelb Grün' }),
];

describe('Spiele filtern', () => {
  const alle = { suche: '', ort: 'alle' as const, nurFavoriten: false, tags: [] as string[] };
  it('sortiert alphabetisch', () => {
    expect(filterSpiele(liste, alle).map((s) => s.titel)).toEqual(['Ampelspiel', 'Schwarzer Mann', 'Zweifelderball']);
  });
  it('sucht in Titel, Beschreibung, Material und Schlagwörtern', () => {
    expect(filterSpiele(liste, { ...alle, suche: 'grün' }).map((s) => s.titel)).toEqual(['Ampelspiel']);
    expect(filterSpiele(liste, { ...alle, suche: 'weiche' }).map((s) => s.titel)).toEqual(['Zweifelderball']);
    expect(filterSpiele(liste, { ...alle, suche: 'fang' })).toHaveLength(2);
  });
  it('filtert nach Ort (beides passt immer), Favorit und Schlagwort', () => {
    expect(filterSpiele(liste, { ...alle, ort: 'halle' }).map((s) => s.titel)).toEqual(['Ampelspiel', 'Zweifelderball']);
    expect(filterSpiele(liste, { ...alle, nurFavoriten: true }).map((s) => s.titel)).toEqual(['Schwarzer Mann']);
    expect(filterSpiele(liste, { ...alle, tags: ['Fangspiel'] })).toHaveLength(2);
    expect(filterSpiele(liste, { ...alle, tags: ['Fangspiel', 'Aufwärmen'] }).map((s) => s.titel)).toEqual(['Ampelspiel']);
  });
  it('listet Schlagwörter eindeutig', () => {
    expect(alleTags(liste)).toEqual(['Aufwärmen', 'Ballspiel', 'Fangspiel']);
  });
});
