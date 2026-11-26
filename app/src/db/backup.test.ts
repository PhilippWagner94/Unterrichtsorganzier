import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, neueId } from './db';
import { BackupFehler, exportiereAlsText, importiereBackup, parseBackup } from './backup';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('Backup', () => {
  it('Export und Import ergeben dieselben Daten (inklusive Bilder)', async () => {
    const klasseId = neueId();
    await db.klassen.add({
      id: klasseId,
      name: '2b',
      einschulungsjahr: 2025,
      wochentag: 3,
      zusatzAktiv: false,
      zusatzWochentag: 5,
      archiviert: false,
    });
    await db.schueler.add({
      id: neueId(),
      klasseId,
      vorname: 'Lea',
      nachname: 'Müller',
      geburtsdatum: '2018-03-04',
      geschlecht: 'w',
    });
    const bild = new Blob([new Uint8Array([1, 2, 3, 250, 255])], { type: 'image/png' });
    await db.anhaenge.add({
      id: 'a1',
      bezugTyp: 'foto',
      bezugId: null,
      name: 'test.png',
      mime: 'image/png',
      blob: bild,
      erstellt: 1,
    });

    const text = await exportiereAlsText();
    await Promise.all(db.tables.map((t) => t.clear()));
    expect(await db.klassen.count()).toBe(0);

    const r = await importiereBackup(parseBackup(text));
    expect(r.zeilen).toBe(3);
    expect((await db.klassen.toArray())[0].name).toBe('2b');
    expect((await db.schueler.toArray())[0].nachname).toBe('Müller');
    const a = await db.anhaenge.get('a1');
    expect(a?.blob.type).toBe('image/png');
    expect(a?.blob.size).toBe(5);
  });

  it('Import ersetzt vorhandene Daten', async () => {
    await db.notizen.add({ id: 'alt', titel: 'alt', text: '', erstellt: 1 });
    const leer = JSON.stringify({ format: 'unterrichtsorganizer-backup', version: 1, exportiert: 'x', tabellen: {} });
    await importiereBackup(parseBackup(leer));
    expect(await db.notizen.count()).toBe(0);
  });

  it('weist ungültige Dateien ab, ohne Daten zu verändern', async () => {
    await db.notizen.add({ id: 'bleibt', titel: 'bleibt', text: '', erstellt: 1 });
    expect(() => parseBackup('kein json')).toThrow(BackupFehler);
    expect(() => parseBackup('{"format":"anderes"}')).toThrow(BackupFehler);
    expect(() =>
      parseBackup(JSON.stringify({ format: 'unterrichtsorganizer-backup', version: 99, tabellen: {} })),
    ).toThrow(BackupFehler);
    expect(await db.notizen.count()).toBe(1);
  });
});
