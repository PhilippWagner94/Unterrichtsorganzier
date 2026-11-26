import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import { setzeAktivesSchuljahr, useAktivesSchuljahr, useSchuljahre } from '../../db/hooks';
import type { FreierTag, FreierTagArt, Schuljahr } from '../../db/types';
import { Button, Card, Chip, ChipAuswahl, Empty, List, Page, Row, Section, Sheet, TextField, bestaetige, useToast } from '../../components/ui';
import { ferienNachladen } from '../../db/seed';
import { formatDatum, heute } from '../../lib/dates';
import { feiertageImZeitraum } from '../../lib/feiertage';
import { schuljahrName, schuljahrStartjahr } from '../../lib/schuljahr';

const ART: { value: FreierTagArt; label: string }[] = [
  { value: 'ferien', label: 'Ferien' },
  { value: 'frei', label: 'Freier Tag' },
  { value: 'feiertag', label: 'Feiertag' },
];

export default function SchuljahrPage() {
  const aktiv = useAktivesSchuljahr();
  const liste = useSchuljahre();
  const tage = useLiveQuery(() => (aktiv ? db.freieTage.where('schuljahrId').equals(aktiv.id).sortBy('von') : []), [aktiv?.id], [] as FreierTag[]) ?? [];
  const [toast, zeigeToast] = useToast();

  const [sjSheet, setSjSheet] = useState<Schuljahr | 'neu' | null>(null);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [ende, setEnde] = useState('');

  const [tagSheet, setTagSheet] = useState<FreierTag | 'neu' | null>(null);
  const [von, setVon] = useState('');
  const [bis, setBis] = useState('');
  const [bez, setBez] = useState('');
  const [art, setArt] = useState<FreierTagArt>('ferien');

  function oeffneSchuljahr(s: Schuljahr | 'neu') {
    if (s === 'neu') {
      const j = schuljahrStartjahr(heute()) + (liste.length ? 1 : 0);
      const basis = liste.length ? Math.max(...liste.map((x) => Number(x.start.slice(0, 4)))) + 1 : j;
      setName(schuljahrName(basis));
      setStart(`${basis}-08-15`);
      setEnde(`${basis + 1}-07-15`);
    } else {
      setName(s.name); setStart(s.start); setEnde(s.ende);
    }
    setSjSheet(s);
  }

  async function speichereSchuljahr() {
    if (!name.trim() || !start || !ende || ende < start) return zeigeToast('Bitte Name und gültigen Zeitraum angeben');
    const id = sjSheet !== 'neu' && sjSheet ? sjSheet.id : neueId();
    await db.schuljahre.put({ id, name: name.trim(), start, ende });
    setSjSheet(null);
  }

  function oeffneTag(t: FreierTag | 'neu') {
    if (t === 'neu') { setVon(''); setBis(''); setBez(''); setArt('ferien'); }
    else { setVon(t.von); setBis(t.bis); setBez(t.bezeichnung); setArt(t.art); }
    setTagSheet(t);
  }

  async function speichereTag() {
    if (!aktiv || !von || !bez.trim()) return;
    const bisWert = bis && bis >= von ? bis : von;
    const id = tagSheet !== 'neu' && tagSheet ? tagSheet.id : neueId();
    await db.freieTage.put({ id, schuljahrId: aktiv.id, von, bis: bisWert, bezeichnung: bez.trim(), art });
    setTagSheet(null);
  }

  const feier = aktiv ? feiertageImZeitraum(aktiv.start, aktiv.ende) : [];

  return (
    <Page title="Schuljahr und Ferien" zurueck>
      <Section title="Schuljahre" aktion={<Button small onClick={() => oeffneSchuljahr('neu')}>＋ Schuljahr</Button>} />
      {liste.length === 0 ? <Empty>Noch kein Schuljahr.</Empty> : (
        <List>
          {liste.map((s) => (
            <Row
              key={s.id}
              title={<>Schuljahr {s.name} {aktiv?.id === s.id ? <Chip>aktiv</Chip> : null}</>}
              sub={`${formatDatum(s.start)} – ${formatDatum(s.ende)}${s.id === 'sj-2027' ? ' · Ferien bitte mit amtlicher Ferienordnung abgleichen' : ''}`}
              onClick={() => oeffneSchuljahr(s)}
            />
          ))}
        </List>
      )}
      <div className="btn-row">
        {liste.map((s) => aktiv?.id !== s.id ? (
          <Button key={s.id} small kind="secondary" onClick={() => setzeAktivesSchuljahr(s.id)}>{s.name} aktiv setzen</Button>
        ) : null)}
        <Button small kind="secondary" onClick={async () => zeigeToast(`${await ferienNachladen()} Einträge aus der Sachsen-Vorlage ergänzt`)}>Sachsen-Vorlage nachladen</Button>
      </div>

      {aktiv ? (
        <>
          <Section title={`Ferien und freie Tage ${aktiv.name}`} aktion={<Button small onClick={() => oeffneTag('neu')}>＋ Eintrag</Button>} />
          {tage.length === 0 ? <Empty>Keine Einträge.</Empty> : (
            <List>
              {tage.map((t) => (
                <Row key={t.id} title={t.bezeichnung} sub={t.von === t.bis ? formatDatum(t.von) : `${formatDatum(t.von)} – ${formatDatum(t.bis)}`} right={ART.find((a) => a.value === t.art)?.label} onClick={() => oeffneTag(t)} />
              ))}
            </List>
          )}
          <Card>
            <div className="small muted">
              Gesetzliche Feiertage in Sachsen werden automatisch berücksichtigt ({feier.length} im Schuljahr: {feier.map((f) => `${formatDatum(f.datum).slice(0, 6)} ${f.name}`).join(', ')}). Ferien der Vorlage 2026/27 stammen aus der amtlichen Verwaltungsvorschrift des Kultusministeriums, 2027/28 aus einer Sekundärquelle.
            </div>
          </Card>
        </>
      ) : null}

      <Sheet offen={sjSheet !== null} onClose={() => setSjSheet(null)} titel={sjSheet === 'neu' ? 'Neues Schuljahr' : 'Schuljahr bearbeiten'}>
        <TextField label="Name (z. B. 2026/27)" value={name} onChange={setName} />
        <TextField label="Erster Unterrichtstag" type="date" value={start} onChange={setStart} />
        <TextField label="Letzter Unterrichtstag" type="date" value={ende} onChange={setEnde} />
        <div className="btn-row">
          <Button onClick={speichereSchuljahr}>Speichern</Button>
          <Button kind="secondary" onClick={() => setSjSheet(null)}>Abbrechen</Button>
          {sjSheet && sjSheet !== 'neu' ? (
            <Button kind="danger" onClick={async () => {
              if (!bestaetige('Schuljahr samt Ferien löschen? Einheiten und Pläne dieses Schuljahres bleiben bestehen, werden aber nicht mehr zugeordnet.')) return;
              await db.freieTage.where('schuljahrId').equals(sjSheet.id).delete();
              await db.schuljahre.delete(sjSheet.id);
              setSjSheet(null);
            }}>Löschen</Button>
          ) : null}
        </div>
      </Sheet>

      <Sheet offen={tagSheet !== null} onClose={() => setTagSheet(null)} titel={tagSheet === 'neu' ? 'Neuer Eintrag' : 'Eintrag bearbeiten'}>
        <TextField label="Bezeichnung (z. B. Herbstferien, Brückentag)" value={bez} onChange={setBez} />
        <TextField label="Von" type="date" value={von} onChange={setVon} />
        <TextField label="Bis (leer = nur ein Tag)" type="date" value={bis} onChange={setBis} />
        <ChipAuswahl optionen={ART} wert={art} onChange={setArt} />
        <div className="btn-row">
          <Button onClick={speichereTag} disabled={!von || !bez.trim()}>Speichern</Button>
          <Button kind="secondary" onClick={() => setTagSheet(null)}>Abbrechen</Button>
          {tagSheet && tagSheet !== 'neu' ? (
            <Button kind="danger" onClick={async () => { await db.freieTage.delete(tagSheet.id); setTagSheet(null); }}>Löschen</Button>
          ) : null}
        </div>
      </Sheet>
      {toast}
    </Page>
  );
}
