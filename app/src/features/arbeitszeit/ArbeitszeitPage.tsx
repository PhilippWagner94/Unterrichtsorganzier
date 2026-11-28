import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getEinstellung, neueId, setEinstellung } from '../../db/db';
import type { Zeiteintrag } from '../../db/types';
import { Button, Card, Chip, ChipAuswahl, Empty, Page, Section, TextField, bestaetige } from '../../components/ui';
import { addTage, formatLang, heute, wochentag } from '../../lib/dates';
import { KATEGORIE_FUER_ART, minuten, summe } from '../../lib/arbeitszeit';
import { dauerMin, einheitZeit, fromMin, aufgabeZeit, formatDauer } from '../../lib/zeit';
import { verpflichtungenAm } from '../../lib/aufgaben';
import { ZeitSheet } from './ZeitSheet';
import { ladeZeitEinstellungen, useZeitEinstellungen, useZeitKategorien } from './zeitDaten';

interface Timer { kategorieId: string; start: number }

function jetztHHMM(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function ymd(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ArbeitszeitPage() {
  const [datum, setDatum] = useState(heute());
  const kategorien = useZeitKategorien();
  const einst = useZeitEinstellungen();
  const eintraege = useLiveQuery(() => db.zeiten.where('datum').equals(datum).toArray(), [datum], []) ?? [];
  const timer = useLiveQuery(() => getEinstellung<Timer | null>('zeitTimer', null), [], null);
  const [kategorieTimer, setKategorieTimer] = useState('zk-vorbereitung');
  const [jetzt, setJetzt] = useState(Date.now());
  const [sheet, setSheet] = useState<{ eintrag?: Zeiteintrag } | null>(null);
  const [neueKat, setNeueKat] = useState('');
  const [msg, setMsg] = useState('');
  const [abArt, setAbArt] = useState('zk-urlaub');
  const [abVon, setAbVon] = useState('');
  const [abBis, setAbBis] = useState('');

  async function eintragenAbwesenheit() {
    const neu: Zeiteintrag[] = [];
    for (let d = abVon; d <= abBis && neu.length < 400; d = addTage(d, 1)) {
      if (wochentag(d) > 5) continue;
      neu.push({ id: neueId(), datum: d, von: einst.schuleVon, bis: einst.schuleBis, kategorieId: abArt, notiz: '', erstellt: Date.now() });
    }
    if (!neu.length) { setMsg('Im gewählten Zeitraum liegen keine Werktage.'); return; }
    await db.zeiten.bulkAdd(neu);
    setMsg(`${neu.length} Tage eingetragen.`);
    setAbVon(''); setAbBis('');
  }
  const kName = (id: string) => kategorien.find((k) => k.id === id)?.name ?? 'Gelöscht';

  useEffect(() => {
    if (!timer) return;
    const t = window.setInterval(() => setJetzt(Date.now()), 15000);
    return () => window.clearInterval(t);
  }, [timer]);

  async function start() {
    await setEinstellung('zeitTimer', { kategorieId: kategorieTimer, start: Date.now() });
    setJetzt(Date.now());
  }
  async function stopp() {
    if (!timer) return;
    const ende = Date.now();
    const d = ymd(timer.start);
    const bis = ymd(ende) === d ? jetztHHMM(ende) : '23:59';
    if (dauerMin(jetztHHMM(timer.start), bis) > 0)
      await db.zeiten.add({ id: neueId(), datum: d, von: jetztHHMM(timer.start), bis, kategorieId: timer.kategorieId, notiz: '', erstellt: ende });
    await setEinstellung('zeitTimer', null);
  }

  /** Unterricht und Verpflichtungen dieses Tages als Zeiteinträge übernehmen (bereits übernommene werden übersprungen). */
  async function ausPlanUebernehmen() {
    const [einheiten, klassen, aufgaben, freie, vorhanden, ze] = await Promise.all([
      db.einheiten.where('datum').equals(datum).toArray(), db.klassen.toArray(), db.aufgaben.toArray(), db.freieTage.toArray(),
      db.zeiten.where('datum').equals(datum).toArray(), ladeZeitEinstellungen(),
    ]);
    const neu: Zeiteintrag[] = [];
    const schonDa = (typ: string, id: string) => vorhanden.some((z) => z.bezugTyp === typ && z.bezugId === id);
    for (const e of einheiten) {
      if (e.status !== 'gehalten' && !(e.status === 'geplant' && datum <= heute())) continue;
      const t = einheitZeit(e, klassen.find((k) => k.id === e.klasseId), ze.doppelMin);
      if (!t || schonDa('einheit', e.id)) continue;
      neu.push({ id: neueId(), datum, von: t.von, bis: t.bis, kategorieId: 'zk-unterricht', notiz: `Klasse ${klassen.find((k) => k.id === e.klasseId)?.name ?? ''}`, bezugTyp: 'einheit', bezugId: e.id, erstellt: Date.now() });
    }
    for (const v of verpflichtungenAm(aufgaben, datum, freie)) {
      const t = aufgabeZeit(v);
      if (!t?.bis || schonDa('verpflichtung', v.id)) continue;
      neu.push({ id: neueId(), datum, von: t.von, bis: t.bis, kategorieId: KATEGORIE_FUER_ART[v.art ?? 'sonstiges'], notiz: v.titel, bezugTyp: 'verpflichtung', bezugId: v.id, erstellt: Date.now() });
    }
    if (neu.length) await db.zeiten.bulkAdd(neu);
    setMsg(neu.length ? `${neu.length} Einträge übernommen.` : 'Nichts Neues zum Übernehmen (Uhrzeiten fehlen oder schon übernommen).');
  }

  const sortiert = [...eintraege].sort((a, b) => a.von.localeCompare(b.von));

  return (
    <Page title="Arbeitszeit" zurueck>
      <div className="btn-row">
        <Link className="btn small" to="/arbeitszeit/statistik" style={{ textDecoration: 'none' }}>📊 Statistik</Link>
        <Link className="btn small secondary" to={`/tag/${datum}`} style={{ textDecoration: 'none' }}>Tagesplan</Link>
      </div>

      <Card>
        <strong>Stoppuhr</strong>
        {timer ? (
          <>
            <div style={{ fontSize: 28, margin: '6px 0' }}>{formatDauer(Math.max(0, Math.floor((jetzt - timer.start) / 60000)))}</div>
            <div className="small">{kName(timer.kategorieId)} seit {jetztHHMM(timer.start)}</div>
            <div className="btn-row"><Button onClick={stopp}>⏹ Stopp und speichern</Button>
              <Button kind="secondary" onClick={async () => { if (bestaetige('Stoppuhr verwerfen?')) await setEinstellung('zeitTimer', null); }}>Verwerfen</Button></div>
          </>
        ) : (
          <>
            <ChipAuswahl optionen={kategorien.map((k) => ({ value: k.id, label: k.name }))} wert={kategorieTimer} onChange={setKategorieTimer} />
            <Button onClick={start}>▶ Start</Button>
          </>
        )}
      </Card>

      <Section title="Tag" />
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <Button small kind="secondary" onClick={() => setDatum(addTage(datum, -1))}>‹</Button>
        <div style={{ flex: 1 }}><TextField label={formatLang(datum)} type="date" value={datum} onChange={(v) => v && setDatum(v)} /></div>
        <Button small kind="secondary" onClick={() => setDatum(addTage(datum, 1))}>›</Button>
      </div>
      <div className="btn-row">
        <Button onClick={() => setSheet({})}>＋ Eintrag</Button>
        <Button kind="secondary" onClick={ausPlanUebernehmen}>Aus Tagesplan übernehmen</Button>
      </div>
      {msg ? <div className="muted small">{msg}</div> : null}
      {sortiert.length === 0 ? <Empty>Für diesen Tag ist noch nichts erfasst.</Empty> : (
        <>
          <div className="list">
            {sortiert.map((z) => (
              <button key={z.id} className="row" onClick={() => setSheet({ eintrag: z })} style={{ width: '100%', textAlign: 'left' }}>
                <div className="main">
                  <div className="title">{kName(z.kategorieId)}</div>
                  <div className="sub">{z.von}–{z.bis}{z.notiz ? ` · ${z.notiz}` : ''}</div>
                </div>
                <div className="right">{formatDauer(minuten(z))}</div>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: 6 }}><strong>Summe: {formatDauer(summe(eintraege))}</strong></div>
        </>
      )}

      <Section title="Urlaub / Krank eintragen" />
      <Card>
        <ChipAuswahl optionen={[{ value: 'zk-urlaub', label: 'Urlaub' }, { value: 'zk-krank', label: 'Krank' }]} wert={abArt} onChange={setAbArt} />
        <div className="grid2">
          <TextField label="Von" type="date" value={abVon} onChange={(v) => { setAbVon(v); if (!abBis || abBis < v) setAbBis(v); }} />
          <TextField label="Bis" type="date" value={abBis} onChange={setAbBis} />
        </div>
        <Button disabled={!abVon || !abBis || abBis < abVon} onClick={eintragenAbwesenheit}>Eintragen (Mo–Fr)</Button>
        <div className="muted small">Je Werktag ein Eintrag mit deiner Schulzeit ({einst.schuleVon}–{einst.schuleBis}). Urlaub und Krank zählen nicht zur Arbeitszeit, sondern erscheinen in der Statistik als Tage.</div>
      </Card>

      <Section title="Einstellungen" />
      <Card>
        <div className="grid2">
          <TextField label="Länge einer Doppelstunde (Min.)" value={String(einst.doppelMin)} onChange={(v) => Number(v) > 0 && setEinstellung('zeitEinstellungen', { ...einst, doppelMin: Number(v) })} />
        </div>
        <div className="grid2">
          <TextField label="Schule von" type="time" value={einst.schuleVon} onChange={(v) => v && setEinstellung('zeitEinstellungen', { ...einst, schuleVon: v })} />
          <TextField label="Schule bis" type="time" value={einst.schuleBis} onChange={(v) => v && setEinstellung('zeitEinstellungen', { ...einst, schuleBis: v })} />
        </div>
        <div className="muted small">Die Schulzeit wird im Tagesplan als Rahmen angezeigt. Die Beginnzeiten der Doppelstunden stellst du bei der Klasse ein.</div>
        <div className="muted small" style={{ marginTop: 8 }}>Eigene Kategorie hinzufügen:</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextField label="Name" value={neueKat} onChange={setNeueKat} />
          <div style={{ alignSelf: 'flex-end' }}>
            <Button disabled={!neueKat.trim()} onClick={async () => { await db.zeitKategorien.add({ id: neueId(), name: neueKat.trim(), sortierung: kategorien.length }); setNeueKat(''); }}>＋</Button>
          </div>
        </div>
        <div>
          {kategorien.map((k) => (
            <Chip key={k.id} kind="gray">
              {k.name}
              {!k.id.startsWith('zk-') ? (
                <button style={{ marginLeft: 6, border: 0, background: 'none' }} aria-label="Entfernen" onClick={async () => {
                  const n = await db.zeiten.where('kategorieId').equals(k.id).count();
                  if (n && !bestaetige(`${n} Einträge haben diese Kategorie. Trotzdem entfernen? (Die Einträge bleiben, zeigen aber „Gelöscht“.)`)) return;
                  await db.zeitKategorien.delete(k.id);
                }}>✕</button>
              ) : null}
            </Chip>
          ))}
        </div>
      </Card>

      <ZeitSheet offen={sheet !== null} onClose={() => setSheet(null)} eintrag={sheet?.eintrag} vorgabe={{ datum, von: sortiert.length ? sortiert[sortiert.length - 1].bis : undefined, bis: sortiert.length ? fromMin(Math.min(1439, (dauerMin('00:00', sortiert[sortiert.length - 1].bis) + 60))) : undefined }} />
    </Page>
  );
}
