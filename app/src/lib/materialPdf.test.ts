import { describe, expect, it } from 'vitest';
import { materialAlsPdf } from './materialPdf';

describe('Material-PDF', () => {
  it('erzeugt ein PDF mit Umlauten', async () => {
    const blob = await materialAlsPdf({
      spiele: [{ id: 's', titel: 'Fangspiel über Bänke', beschreibung: 'Ärgerliches ß '.repeat(200), variationen: 'Mit Ball', ort: 'halle', ziele: ['Aufwärmen'], material: '', quelle: '', favorit: false, erstellt: 0 }],
      reihen: [{ id: 'r', thema: 'Rolle', schritte: [{ titel: 'Hocke', beschreibung: 'x' }], sicherheit: 'Matten', quelle: '', erstellt: 0 }],
    });
    const buf = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(...buf.slice(0, 5))).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(1500);
  });
});
