import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import { stufeIm, useAktivesSchuljahr, useKlassenAktiv } from '../../db/hooks';
import type { BewertungsZeile, Geschlecht, TestTyp } from '../../db/types';
import {
  Button, Card, ChipAuswahl, Empty, Field, List, NumberField, Page, Section, SelectField, TextArea, TextField, bestaetige, parseDezimal, useToast,
} from '../../components/ui';
import { useAutosave } from '../../lib/useAutosave';
import { bestleistung, formatNote, noteFuerWert } from '../../lib/noten';
import { heute } from '../../lib/dates';
import { vollerName } from '../../lib/schuljahr';
import { formatWert } from './auswertung';

const TYPEN: { value: TestTyp; label: string }[] = [
  { value: 'messwert', label: 'Messwert' },
  { value: 'punkte', label: 'Punkte' },
  { value: 'note', label: 'Note' },
  { value: 'verbal', label: 'Verbal' },
];
const STUFEN = [{ value: 'alle', label: 'alle' }, ...[1, 2, 3, 4].map((n) => ({ value: String(n), label: `Klasse ${n}` }))];
const GESCHL = [{ value: 'alle', label: 'alle' }, { value: 'w', label: 'weiblich' }, { value: 'm', label: 'männlich' }, { value: 'd', label: 'divers' }];

interface Eingabe {
  wert: string;
  note: string;
  verbal: string;
}

export default function TestPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { daten: t, set, flush } = useAutosave(db.tests, id);
  const sj = useAktivesSchuljahr();
  const klassen = useKlassenAktiv();
  const [params] = useSearchParams();
  const [klasseId, setKlasseId] = useState(params.get('klasse') ?? '');
  const [datum, setDatum] = useState(params.get('datum') ?? heute());
  const [eingaben, setEingaben] = useState<Record<string, Eingabe>>({});
  const [toast, zeigeToast] = useToast();

  const kinder = useLiveQuery(() => (klasseId ? db.schueler.where('klasseId').equals(klasseId).toArray() : []), [klasseId], []) ?? [];
  const ergebnisse = useLiveQuery(() => db.testergebnisse.where('testId').equals(id).toArray(), [id], []) ?? [];

  useEffect(() => {
    if (!klasseId && klassen.length) setKlasseId(klassen[0].klasse.id);
  }, [klassen.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // vorhandene Ergebnisse dieses Datums vorbelegen
  useEffect(() => {
    const neu: Record<string, Eingabe> = {};
    for (const k of kinder) {
      const e = ergebnisse.find((x) => x.schuelerId === k.id && x.datum === datum);
      if (e) neu[k.id] = { wert: e.wert === undefined ? '' : String(e.wert).replace('.', ','), note: e.note === undefined ? '' : String(e.note).replace('.', ','), verbal: e.verbal ?? '' };
    }
    setEingaben(neu);
  }, [klasseId, datum, kinder.length, ergebnisse.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (t === undefined) return <Page title="Test" zurueck><Empty>Lädt …</Empty></Page>;
  if (t === null) return <Page title="Test" zurueck><Empty>Test nicht gefunden.</Empty></Page>;

  const klasse = klassen.find((k) => k.klasse.id === klasseId)?.klasse;
  const stufe = klasse ? stufeIm(klasse, sj) ?? 1 : 1;
  const mitWert = t.typ === 'messwert' || t.typ === 'punkte';
  const setZeile = (i: number, patch: Partial<BewertungsZeile>) => set({ tabelle: t.tabelle.map((z, k) => (k === i ? { ...z, ...patch } : z)) });
  const eingabe = (sid: string): Eingabe => eingaben[sid] ?? { wert: '', note: '', verbal: '' };
  const setEingabe = (sid: string, patch: Partial<Eingabe>) => setEingaben({ ...eingaben, [sid]: { ...eingabe(sid), ...patch } });

  function autoNote(sid: string, geschlecht: Geschlecht | undefined): number | undefined {
    const w = parseDezimal(eingabe(sid).wert);
    return w === undefined || !t ? undefined : noteFuerWert(t, w, stufe, geschlecht);
  }

  async function speichern() {
    if (!t) return;
    await flush();
    let n = 0;
    for (const k of kinder) {
      const e = eingabe(k.id);
      const wert = parseDezimal(e.wert);
      const manuell = parseDezimal(e.note);
      const note = manuell ?? (mitWert ? autoNote(k.id, k.geschlecht) : undefined);
      const verbal = e.verbal.trim() || undefined;
      if (wert === undefined && note === undefined && !verbal) continue;
      const vorhanden = ergebnisse.find((x) => x.schuelerId === k.id && x.datum === datum);
      await db.testergebnisse.put({ id: vorhanden?.id ?? neueId(), testId: t.id, schuelerId: k.id, datum, wert, note, verbal });
      n++;
    }
    zeigeToast(`${n} Ergebnisse gespeichert`);
  }

  return (
    <Page title={t.name || 'Test'} zurueck>
      <TextField label="Name" value={t.name} onChange={(v) => set({ name: v })} />
      <div className="muted small">Typ</div>
      <ChipAuswahl optionen={TYPEN} wert={t.typ} onChange={(v) => set({ typ: v })} />
      {mitWert ? (
        <>
          <TextField label="Einheit (s, m, min, Anzahl, Punkte …)" value={t.einheit} onChange={(v) => set({ einheit: v })} />
          <div className="muted small">Was ist besser?</div>
          <ChipAuswahl
            optionen={[{ value: 'min' as const, label: 'Kleiner (z. B. Zeit)' }, { value: 'max' as const, label: 'Größer (z. B. Weite)' }]}
            wert={t.richtung}
            onChange={(v) => set({ richtung: v })}
          />
        </>
      ) : null}
      <TextArea label="Beschreibung" value={t.beschreibung} onChange={(v) => set({ beschreibung: v })} />

      {mitWert ? (
        <>
          <Section title="Bewertungstabelle (optional)" aktion={<Button small onClick={() => set({ tabelle: [...t.tabelle, { klassenstufe: 'alle', geschlecht: 'alle', grenze: 0, note: 1 }] })}>＋ Zeile</Button>} />
          <div className="muted small" style={{ marginBottom: 8 }}>
            Pro Zeile: Wer diesen Grenzwert {t.richtung === 'min' ? 'unterbietet oder erreicht (≤)' : 'erreicht oder übertrifft (≥)'}, bekommt die Note. Es gilt die beste passende Note. Zeilen für eine bestimmte Klassenstufe oder ein Geschlecht gehen vor „alle“.
          </div>
          {t.tabelle.map((z, i) => (
            <Card key={i}>
              <div className="grid2">
                <SelectField label="Klassenstufe" value={String(z.klassenstufe)} onChange={(v) => setZeile(i, { klassenstufe: v === 'alle' ? 'alle' : Number(v) })} options={STUFEN} />
                <SelectField label="Geschlecht" value={z.geschlecht} onChange={(v) => setZeile(i, { geschlecht: v as BewertungsZeile['geschlecht'] })} options={GESCHL} />
                <NumberField label={`Grenzwert (${t.einheit || '–'})`} value={z.grenze} onChange={(v) => setZeile(i, { grenze: v ?? 0 })} />
                <NumberField label="Note" value={z.note} onChange={(v) => setZeile(i, { note: v ?? 1 })} />
              </div>
              <Button small kind="danger" onClick={() => set({ tabelle: t.tabelle.filter((_, k) => k !== i) })}>Zeile entfernen</Button>
            </Card>
          ))}
        </>
      ) : null}

      <Section title="Ergebnisse erfassen" />
      {klassen.length === 0 ? <Empty>Lege zuerst eine Klasse mit Kindern an.</Empty> : (
        <>
          <SelectField label="Klasse" value={klasseId} onChange={setKlasseId} options={klassen.map((k) => ({ value: k.klasse.id, label: `Klasse ${k.klasse.name}` }))} />
          <TextField label="Datum" type="date" value={datum} onChange={setDatum} />
          {stufe === 1 && t.typ !== 'verbal' ? <div className="muted small" style={{ marginBottom: 8 }}>Klasse 1: In der Regel verbale Einschätzung statt Note.</div> : null}
          {kinder.length === 0 ? <Empty>Keine Kinder in dieser Klasse.</Empty> : null}
          {[...kinder].sort((a, b) => a.nachname.localeCompare(b.nachname, 'de')).map((k) => {
            const e = eingabe(k.id);
            const auto = mitWert ? autoNote(k.id, k.geschlecht) : undefined;
            const best = bestleistung(t, ergebnisse.filter((x) => x.schuelerId === k.id));
            return (
              <Card key={k.id}>
                <div style={{ fontWeight: 600 }}>{vollerName(k)}</div>
                {best ? <div className="muted small">Bestleistung: {formatWert(best.wert, t.einheit)} ({best.datum.split('-').reverse().join('.')})</div> : null}
                <div className="grid2" style={{ marginTop: 6 }}>
                  {mitWert ? <Field label={`Wert (${t.einheit || '–'})`}><input type="text" inputMode="decimal" value={e.wert} onChange={(ev) => setEingabe(k.id, { wert: ev.target.value })} /></Field> : null}
                  {t.typ !== 'verbal' ? (
                    <Field label={auto !== undefined && !e.note ? `Note (auto: ${formatNote(auto)})` : 'Note'}>
                      <input type="text" inputMode="decimal" value={e.note} placeholder={auto !== undefined ? formatNote(auto) : ''} onChange={(ev) => setEingabe(k.id, { note: ev.target.value })} />
                    </Field>
                  ) : null}
                </div>
                {t.typ === 'verbal' || stufe === 1 ? (
                  <Field label="Verbale Einschätzung"><textarea value={e.verbal} onChange={(ev) => setEingabe(k.id, { verbal: ev.target.value })} /></Field>
                ) : null}
              </Card>
            );
          })}
          {kinder.length ? <div className="sticky-actions"><Button block onClick={speichern}>Ergebnisse speichern</Button></div> : null}
        </>
      )}

      <Section title="Letzte Ergebnisse" />
      {ergebnisse.length === 0 ? <Empty>Noch keine Ergebnisse.</Empty> : (
        <List>
          {[...ergebnisse].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 8).map((x) => (
            <div key={x.id} className="row">
              <div className="main">
                <div className="title">{kinderName(x.schuelerId)}</div>
                <div className="sub">{x.datum.split('-').reverse().join('.')}</div>
              </div>
              <div className="right">{x.wert !== undefined ? formatWert(x.wert, t.einheit) : ''}{x.note !== undefined ? ` · Note ${formatNote(x.note)}` : ''}{x.verbal ? ' · verbal' : ''}</div>
            </div>
          ))}
        </List>
      )}

      <div className="btn-row">
        <Button
          kind="danger"
          onClick={async () => {
            if (!bestaetige(`Test „${t.name}“ samt allen Ergebnissen löschen?`)) return;
            await flush();
            await db.testergebnisse.where('testId').equals(t.id).delete();
            await db.tests.delete(t.id);
            nav(-1);
          }}
        >
          Test löschen
        </Button>
      </div>
      {toast}
    </Page>
  );

  function kinderName(sid: string) {
    const k = kinder.find((x) => x.id === sid);
    return k ? vollerName(k) : 'Kind (andere Klasse)';
  }
}
