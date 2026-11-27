import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/db';
import { erzeugeMaterialExport, importiereMaterial, parseMaterial } from './material';
import { leereEinheit } from './plan';

beforeEach(async () => { await Promise.all(db.tables.map((t) => t.clear())); });

describe('Material-Export ohne Personendaten', () => {
  it('enthält keine Kinder, Noten oder Notizen der Einheit und lässt sich wieder importieren', async () => {
    await db.spiele.add({ id: 's1', titel: 'Fangspiel', beschreibung: '', material: '', ort: 'beides', ziele: [], quelle: '', favorit: false, erstellt: 1 });
    await db.schueler.add({ id: 'k1', klasseId: 'a', vorname: 'Anna', nachname: 'Geheim', geburtsdatum: '2018-01-01' } as never);
    await db.testergebnisse.add({ id: 'r1', testId: 't', schuelerId: 'k1', datum: '2026-09-01', wert: 5 });
    await db.klassen.add({ id: 'a', name: '3a', einschulungsjahr: 2024, wochentag: 1, zusatzAktiv: false, zusatzWochentag: 3, archiviert: false });
    await db.einheiten.add({ ...leereEinheit('a', 's', '2026-09-07'), status: 'gehalten', lernbereichId: 'lb-la', hauptteil: 'Sprint', notizen: 'Anna war krank', reflexion: 'privat', spielIds: ['s1'] });
    const { text } = await erzeugeMaterialExport({ spiele: true, reihen: true, entwuerfe: true, ausEinheiten: true, tests: true, notizen: false, bilder: false });
    expect(text).not.toContain('Geheim');
    expect(text).not.toContain('Anna war krank');
    expect(text).not.toContain('privat');
    expect(text).not.toContain('3a');
    const d = parseMaterial(text);
    expect(d.tabellen.entwuerfe).toHaveLength(1);
    expect(d.tabellen.entwuerfe[0].klassenstufe).toBe(3);
    await Promise.all(db.tables.map((t) => t.clear()));
    const neu = await importiereMaterial(d);
    expect(neu).toEqual({ spiele: 1, entwuerfe: 1 });
    expect(await importiereMaterial(d)).toEqual({ spiele: 0, entwuerfe: 0 }); // zweiter Import fügt nichts doppelt hinzu
  });
});
