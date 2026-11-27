import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Einheit, EinheitStatus, Ort } from '../../db/types';
import {
  Button, Card, Check, Chip, ChipAuswahl, Empty, Page, Section, SelectField, Sheet, TextArea, TextField, bestaetige,
} from '../../components/ui';
import { Anhaenge } from '../../components/Anhaenge';
import { SpielAuswahl, ReiheAuswahl } from '../bibliothek/Auswahl';
import { markiereAusfall, planNeuVerteilen, stelleEinheitWiederHer } from '../../lib/planAktionen';
import type { NachAusfall } from '../../lib/plan';
import { TestsInEinheit } from '../tests/TestsInEinheit';
import { formatLang, isoWoche } from '../../lib/dates';
import { doppelstufeFuerKlassenstufe, klassenstufe, schuljahrStartjahr } from '../../lib/schuljahr';

const STATUS: { value: EinheitStatus; label: string }[] = [
  { value: 'geplant', label: 'Geplant' },
  { value: 'gehalten', label: 'Gehalten' },
  { value: 'ausfall', label: 'Ausfall' },
  { value: 'vertretung', label: 'Vertretung' },
  { value: 'verschoben', label: 'Verschoben' },
];
const ORT: { value: Ort; label: string }[] = [
  { value: 'halle', label: 'Halle' },
  { value: 'draussen', label: 'Draußen' },
  { value: 'beides', label: 'Beides' },
];
const GRUENDE = ['Krankheit', 'Wettkampf', 'Wetter', 'Schulveranstaltung', 'Sonstiges'];
const AUSFALL_AKTIONEN: { value: NachAusfall; label: string; hilfe: string }[] = [
  { value: 'nachruecken', label: 'Nachrücken', hilfe: 'Der Inhalt rutscht auf den nächsten Termin, alles dahinter verschiebt sich.' },
  { value: 'puffer', label: 'Puffer nutzen', hilfe: 'Die nächste Pufferstunde im Plan fällt weg, der Rest bleibt im Takt.' },
  { value: 'verwerfen', label: 'Entfällt', hilfe: 'Der Inhalt wird aus dem Plan gestrichen (Block wird kürzer).' },
];

/** Lädt eine Einheit einmal in lokalen Zustand und speichert Änderungen verzögert (Tippen bleibt flüssig). */
function useEinheitState(id: string) {
  const [e, setE] = useState<Einheit | null | undefined>(undefined);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<Einheit | null>(null);

  const flush = async () => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
      timer.current = undefined;
      if (latest.current) await db.einheiten.put(latest.current);
    }
  };

  useEffect(() => {
    let lebt = true;
    db.einheiten.get(id).then((x) => {
      if (!lebt) return;
      latest.current = x ?? null;
      setE(x ?? null);
    });
    return () => {
      lebt = false;
      void flush();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<Einheit>) => {
    const basis = latest.current;
    if (!basis) return;
    const neu = { ...basis, ...patch };
    latest.current = neu;
    setE(neu);
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      void db.einheiten.put(neu);
    }, 500);
  };

  const reload = async () => {
    await flush();
    const x = await db.einheiten.get(id);
    latest.current = x ?? null;
    setE(x ?? null);
  };

  return { e, set, reload, flush };
}

export default function EinheitPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { e, set, reload, flush } = useEinheitState(id);
  const klasse = useLiveQuery(() => (e ? db.klassen.get(e.klasseId) : undefined), [e?.klasseId]);
  const schuljahr = useLiveQuery(() => (e ? db.schuljahre.get(e.schuljahrId) : undefined), [e?.schuljahrId]);
  const lernbereiche = useLiveQuery(() => db.lernbereiche.toArray().then((l) => l.sort((a, b) => a.sortierung - b.sortierung)), [], []) ?? [];
  const lernziele = useLiveQuery(() => db.lernziele.toArray(), [], []) ?? [];
  const spiele = useLiveQuery(() => db.spiele.toArray(), [], []) ?? [];
  const reihen = useLiveQuery(() => db.reihen.toArray(), [], []) ?? [];

  const [ausfallOffen, setAusfallOffen] = useState(false);
  const [aktion, setAktion] = useState<NachAusfall>('nachruecken');
  const [grund, setGrund] = useState('Krankheit');
  const [vertretungOffen, setVertretungOffen] = useState(false);
  const [vertretung, setVertretung] = useState('');
  const [spielWahl, setSpielWahl] = useState(false);
  const [reiheWahl, setReiheWahl] = useState(false);

  if (e === undefined) return <Page title="Einheit" zurueck><Empty>Lädt …</Empty></Page>;
  if (e === null) return <Page title="Einheit" zurueck><Empty>Einheit nicht gefunden.</Empty></Page>;

  const stufe = klasse && schuljahr ? klassenstufe(klasse, schuljahrStartjahr(schuljahr.start)) : undefined;
  const doppel = stufe ? doppelstufeFuerKlassenstufe(stufe) : undefined;
  const zielListe = lernziele.filter(
    (z) => z.lernbereichId === e.lernbereichId && (!doppel || z.doppelstufe === doppel || (e.zielIds.includes(z.id))),
  );
  const lbOptionen = [
    { value: '', label: '– nicht festgelegt –' },
    { value: 'puffer', label: 'Pufferstunde' },
    ...lernbereiche.filter((l) => l.aktiv).map((l) => ({ value: l.id, label: l.name })),
  ];
  const lbWert = e.istPuffer ? 'puffer' : e.lernbereichId ?? '';
  const lb = lernbereiche.find((l) => l.id === e.lernbereichId);
  const gewaehlteSpiele = e.spielIds.map((i) => spiele.find((s) => s.id === i)).filter(Boolean);
  const gewaehlteReihen = e.reiheIds.map((i) => reihen.find((r) => r.id === i)).filter(Boolean);

  async function statusWaehlen(neu: EinheitStatus) {
    if (!e || neu === e.status) return;
    await flush();
    if (neu === 'ausfall') {
      setGrund(e.ausfallGrund || 'Krankheit');
      setAusfallOffen(true);
    } else if (neu === 'vertretung') {
      setVertretung(e.vertretungsnotiz);
      setVertretungOffen(true);
    } else if (neu === 'geplant') {
      await stelleEinheitWiederHer(e.id);
      await reload();
    } else {
      const patch: Partial<Einheit> =
        neu === 'verschoben' ? { status: neu, blockId: null, lernbereichId: null, istPuffer: false } : { status: neu };
      await db.einheiten.update(e.id, patch);
      await planNeuVerteilen(e.klasseId, e.schuljahrId);
      await reload();
    }
  }

  async function ausfallBestaetigen() {
    if (!e) return;
    await flush();
    await markiereAusfall(e.id, grund, aktion);
    setAusfallOffen(false);
    await reload();
  }

  async function vertretungBestaetigen() {
    if (!e) return;
    await flush();
    await db.einheiten.update(e.id, {
      status: 'vertretung',
      vertretungsnotiz: vertretung,
      blockId: null,
      lernbereichId: null,
      istPuffer: false,
    });
    await planNeuVerteilen(e.klasseId, e.schuljahrId);
    setVertretungOffen(false);
    await reload();
  }

  function lernbereichWaehlen(v: string) {
    // manuelle Wahl: Einheit wird vom automatischen Verteilen ausgenommen
    if (v === '') set({ lernbereichId: null, istPuffer: false, blockId: null, fixiert: false, zielIds: [] });
    else if (v === 'puffer') set({ lernbereichId: null, istPuffer: true, blockId: null, fixiert: true, zielIds: [] });
    else set({ lernbereichId: v, istPuffer: false, blockId: null, fixiert: true, zielIds: [] });
  }

  return (
    <Page title={klasse ? `${klasse.name} · ${formatLang(e.datum)}` : formatLang(e.datum)} zurueck>
      <ChipAuswahl optionen={STATUS} wert={e.status} onChange={statusWaehlen} />

      {e.status === 'ausfall' ? (
        <Card kind="warn">
          <strong>Ausfall</strong>
          <div>{e.ausfallGrund || 'ohne Grund'}</div>
        </Card>
      ) : null}
      {e.status === 'vertretung' ? (
        <Card kind="warn">
          <strong>Vertretung</strong>
          <TextArea label="Was wurde ungefähr gemacht?" value={e.vertretungsnotiz} onChange={(v) => set({ vertretungsnotiz: v })} />
        </Card>
      ) : null}

      <Section title="Inhalt" />
      <SelectField label="Lernbereich" value={lbWert} onChange={lernbereichWaehlen} options={lbOptionen} />
      {e.fixiert ? (
        <Check label="Von der automatischen Verteilung ausgenommen" checked={e.fixiert} onChange={(v) => set({ fixiert: v })} />
      ) : null}
      <TextField label="Thema / Titel" value={e.titel} onChange={(v) => set({ titel: v })} placeholder="z. B. Rolle vorwärts üben" />
      {zielListe.length ? (
        <div style={{ marginBottom: 12 }}>
          <div className="muted small">Lernziele {lb ? `(${lb.kuerzel}${doppel ? `, Klasse ${doppel}` : ''})` : ''}</div>
          {zielListe.map((z) => (
            <Check
              key={z.id}
              label={z.text.length > 110 ? z.text.slice(0, 107) + '…' : z.text}
              checked={e.zielIds.includes(z.id)}
              onChange={(v) => set({ zielIds: v ? [...e.zielIds, z.id] : e.zielIds.filter((x) => x !== z.id) })}
            />
          ))}
        </div>
      ) : null}

      <Section title="Ablauf" />
      <TextArea label="Aufwärmen" value={e.aufwaermen} onChange={(v) => set({ aufwaermen: v })} />
      <TextArea label="Hauptteil" value={e.hauptteil} onChange={(v) => set({ hauptteil: v })} rows={5} />
      <TextArea label="Ausklang" value={e.ausklang} onChange={(v) => set({ ausklang: v })} />
      <TextField label="Material / Geräteaufbau" value={e.material} onChange={(v) => set({ material: v })} />
      <div className="muted small">Ort</div>
      <ChipAuswahl optionen={ORT} wert={e.ort} onChange={(v) => set({ ort: v })} />
      <TextField label="Wetter-Alternative" value={e.wetterAlternative} onChange={(v) => set({ wetterAlternative: v })} />

      <Section title="Spiele und methodische Reihen" />
      <div className="chips">
        {gewaehlteSpiele.map((s) => <Chip key={s!.id}>🎲 {s!.titel}</Chip>)}
        {gewaehlteReihen.map((r) => <Chip key={r!.id}>🪜 {r!.thema}</Chip>)}
      </div>
      <div className="btn-row">
        <Button small kind="secondary" onClick={() => setSpielWahl(true)}>Spiele wählen</Button>
        <Button small kind="secondary" onClick={() => setReiheWahl(true)}>Methodik wählen</Button>
      </div>
      <SpielAuswahl offen={spielWahl} onClose={() => setSpielWahl(false)} gewaehlt={e.spielIds} onChange={(ids) => set({ spielIds: ids })} />
      <ReiheAuswahl offen={reiheWahl} onClose={() => setReiheWahl(false)} gewaehlt={e.reiheIds} onChange={(ids) => set({ reiheIds: ids })} />

      <TestsInEinheit e={e} set={set} />

      <Section title="Nachbereitung" />
      <TextArea label="Reflexion (was lief gut, was ändern?)" value={e.reflexion} onChange={(v) => set({ reflexion: v })} />
      <TextArea label="Notizen" value={e.notizen} onChange={(v) => set({ notizen: v })} />

      <Section title="Fotos und Anhänge" />
      <Anhaenge bezugTyp="einheit" bezugId={e.id} />

      <Section title="Termin" />
      <TextField
        label="Datum (zum Verschieben ändern)"
        type="date"
        value={e.datum}
        onChange={async (v) => {
          if (!v || v === e.datum) return;
          set({ datum: v, sollDatum: e.sollDatum ?? e.datum });
          await flush();
          await planNeuVerteilen(e.klasseId, e.schuljahrId);
        }}
      />
      <div className="muted small">KW {isoWoche(e.datum)} ({isoWoche(e.datum) % 2 === 0 ? 'gerade' : 'ungerade'}){e.zusatz ? ' · Zusatz-Doppelstunde' : ''}{e.sollDatum && e.sollDatum !== e.datum ? ` · verlegt (Regeltermin: ${formatLang(e.sollDatum)})` : ''}</div>
      <div className="btn-row">
        <Button
          kind="danger"
          onClick={async () => {
            if (!bestaetige('Diese Einheit endgültig löschen?')) return;
            await flush();
            const klasseId = e.klasseId;
            const sj = e.schuljahrId;
            await db.anhaenge.where('[bezugTyp+bezugId]').equals(['einheit', e.id]).delete();
            await db.einheiten.delete(e.id);
            await planNeuVerteilen(klasseId, sj);
            nav(-1);
          }}
        >
          Einheit löschen
        </Button>
      </div>

      <Sheet offen={ausfallOffen} onClose={() => setAusfallOffen(false)} titel="Einheit fällt aus">
        <div className="muted small">Grund</div>
        <div className="chips">
          {GRUENDE.map((g) => (
            <button key={g} className={`chip-btn ${grund === g ? 'on' : ''}`} onClick={() => setGrund(g)}>{g}</button>
          ))}
        </div>
        <TextField label="Grund (frei)" value={grund} onChange={setGrund} />
        <div className="muted small">Was passiert mit dem geplanten Inhalt?</div>
        <ChipAuswahl optionen={AUSFALL_AKTIONEN.map((a) => ({ value: a.value, label: a.label }))} wert={aktion} onChange={setAktion} />
        <div className="muted small" style={{ marginBottom: 10 }}>{AUSFALL_AKTIONEN.find((a) => a.value === aktion)?.hilfe}</div>
        <div className="btn-row">
          <Button onClick={ausfallBestaetigen}>Als Ausfall speichern</Button>
          <Button kind="secondary" onClick={() => setAusfallOffen(false)}>Abbrechen</Button>
        </div>
      </Sheet>

      <Sheet offen={vertretungOffen} onClose={() => setVertretungOffen(false)} titel="Vertretung">
        <p className="muted small">Der geplante Inhalt rückt auf den nächsten Termin. Notiere kurz, was in der Vertretung gemacht wurde.</p>
        <TextArea label="Was wurde ungefähr gemacht?" value={vertretung} onChange={setVertretung} />
        <div className="btn-row">
          <Button onClick={vertretungBestaetigen}>Speichern</Button>
          <Button kind="secondary" onClick={() => setVertretungOffen(false)}>Abbrechen</Button>
        </div>
      </Sheet>
    </Page>
  );
}
