import { istSammlungsSpiel, spielMitKanonischenTags } from '../lib/tags';
import { db, getEinstellung, setEinstellung } from './db';
import type { Fach, FreierTag, Lernbereich, Lernziel, Schuljahr, Test } from './types';
import { FACH_SPORT_ID, LERNBEREICHE, LERNZIELE } from '../data/lehrplanSport';
import { SCHULJAHRE_VORLAGE } from '../data/ferienSachsen';
import { schuljahrName } from '../lib/schuljahr';

export const SEED_VERSION = 1;

function lehrplanZeilen() {
  const fach: Fach = { id: FACH_SPORT_ID, name: 'Sport' };
  const lernbereiche: Lernbereich[] = LERNBEREICHE.map((v, i) => ({
    id: `lb-${v.key}`,
    fachId: FACH_SPORT_ID,
    name: v.name,
    kuerzel: v.kuerzel,
    richtwertMin: v.richtwertMin,
    richtwertMax: v.richtwertMax,
    art: v.art,
    aktiv: v.aktiv,
    farbe: v.farbe,
    sortierung: i,
  }));
  const zaehler = new Map<string, number>();
  const lernziele: Lernziel[] = LERNZIELE.map((v, i) => {
    const k = `${v.lb}-${v.stufe.replace('/', '')}`;
    const n = (zaehler.get(k) ?? 0) + 1;
    zaehler.set(k, n);
    return {
      id: `lz-${k}-${n}`,
      lernbereichId: `lb-${v.lb}`,
      doppelstufe: v.stufe,
      text: v.text,
      sortierung: i,
    };
  });
  return { fach, lernbereiche, lernziele };
}

function ferienZeilen() {
  const schuljahre: Schuljahr[] = [];
  const tage: FreierTag[] = [];
  for (const v of SCHULJAHRE_VORLAGE) {
    const id = `sj-${v.startjahr}`;
    schuljahre.push({ id, name: schuljahrName(v.startjahr), start: v.start, ende: v.ende });
    v.tage.forEach((t, i) =>
      tage.push({ id: `ft-${v.startjahr}-${i + 1}`, schuljahrId: id, von: t.von, bis: t.bis, bezeichnung: t.bezeichnung, art: t.art }),
    );
  }
  return { schuljahre, tage };
}

/** Beispiel-Tests ohne Bewertungstabelle; Grenzwerte und Noten trägt die Lehrkraft selbst ein. */
function beispielTests(): Test[] {
  return [
    { id: 'test-sprint', name: 'Sprint', typ: 'messwert', einheit: 's', richtung: 'min', tabelle: [], beschreibung: 'Klasse 1/2: 15–20 m, Klasse 3/4: bis 50 m, mit Zeitnahme.' },
    { id: 'test-weitsprung', name: 'Weitsprung', typ: 'messwert', einheit: 'm', richtung: 'max', tabelle: [], beschreibung: 'Anlauf als Steigerungslauf, Absprungzone 80 cm.' },
    { id: 'test-schlagwurf', name: 'Schlagwurf', typ: 'messwert', einheit: 'm', richtung: 'max', tabelle: [], beschreibung: 'Schlagwurf aus der Wurfauslage.' },
    { id: 'test-ausdauer', name: 'Ausdauerlauf', typ: 'messwert', einheit: 'm', richtung: 'max', tabelle: [], beschreibung: 'Strecke in 10 min (Klasse 1/2) bzw. 15 min (Klasse 3/4) im gleichmäßigen Tempo.' },
  ];
}

/** Erststart: Lehrplan-Vorlage, Ferien und Beispiel-Tests anlegen. Bestehende Daten werden nie überschrieben. */
export async function seedBeiBedarf(): Promise<void> {
  const version = await getEinstellung<number>('seedVersion', 0);
  if (version >= SEED_VERSION) return;
  const { fach, lernbereiche, lernziele } = lehrplanZeilen();
  const { schuljahre, tage } = ferienZeilen();
  await db.transaction(
    'rw',
    [db.faecher, db.lernbereiche, db.lernziele, db.schuljahre, db.freieTage, db.tests, db.einstellungen],
    async () => {
      await db.faecher.put(fach);
      await db.lernbereiche.bulkPut(lernbereiche);
      await db.lernziele.bulkPut(lernziele);
      await db.schuljahre.bulkPut(schuljahre);
      await db.freieTage.bulkPut(tage);
      await db.tests.bulkPut(beispielTests());
      await setEinstellung('seedVersion', SEED_VERSION);
    },
  );
}

/** Einmalige Ergänzungen für bestehende Installationen (ohne bearbeitete oder gelöschte Einträge erneut anzulegen). */
export async function ergaenzungenAnwenden(): Promise<void> {
  if (await getEinstellung<boolean>('ergaenzung-basistests', false)) return;
  const { lernbereiche, lernziele } = lehrplanZeilen();
  await db.transaction('rw', [db.lernbereiche, db.lernziele, db.einstellungen], async () => {
    for (const lb of lernbereiche.filter((l) => l.id === 'lb-bt')) if (!(await db.lernbereiche.get(lb.id))) await db.lernbereiche.put(lb);
    for (const lz of lernziele.filter((l) => l.lernbereichId === 'lb-bt')) if (!(await db.lernziele.get(lz.id))) await db.lernziele.put(lz);
    await setEinstellung('ergaenzung-basistests', true);
  });
}

/** Einmalig: Schlagwörter der importierten Spielesammlung auf die feste Liste zusammenfassen. */
export async function tagsAufraeumen(): Promise<void> {
  if (await getEinstellung<boolean>('ergaenzung-tags-v1', false)) return;
  const spiele = await db.spiele.toArray();
  const neu = spiele.filter(istSammlungsSpiel).map(spielMitKanonischenTags);
  await db.transaction('rw', [db.spiele, db.einstellungen], async () => {
    if (neu.length) await db.spiele.bulkPut(neu);
    await setEinstellung('ergaenzung-tags-v1', true);
  });
}

/** Fehlende Lehrplan-Einträge wieder anlegen (vorhandene und bearbeitete bleiben unverändert). */
export async function lehrplanNachladen(): Promise<number> {
  const { fach, lernbereiche, lernziele } = lehrplanZeilen();
  let neu = 0;
  await db.transaction('rw', [db.faecher, db.lernbereiche, db.lernziele], async () => {
    if (!(await db.faecher.get(fach.id))) await db.faecher.put(fach);
    for (const lb of lernbereiche) if (!(await db.lernbereiche.get(lb.id))) (await db.lernbereiche.put(lb), neu++);
    for (const lz of lernziele) if (!(await db.lernziele.get(lz.id))) (await db.lernziele.put(lz), neu++);
  });
  return neu;
}

/** Fehlende Schuljahre und Ferien aus der Vorlage anlegen (vorhandene bleiben unverändert). */
export async function ferienNachladen(): Promise<number> {
  const { schuljahre, tage } = ferienZeilen();
  let neu = 0;
  await db.transaction('rw', [db.schuljahre, db.freieTage], async () => {
    for (const s of schuljahre) if (!(await db.schuljahre.get(s.id))) (await db.schuljahre.put(s), neu++);
    for (const t of tage) if (!(await db.freieTage.get(t.id))) (await db.freieTage.put(t), neu++);
  });
  return neu;
}
