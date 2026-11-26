import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import { stufeIm, useAktivesSchuljahr } from '../../db/hooks';
import type { Geschlecht } from '../../db/types';
import {
  Button, Card, Chip, ChipAuswahl, Empty, List, Page, Row, Section, Sheet, TextArea, TextField, useToast,
} from '../../components/ui';
import { KlasseFormular } from './KlasseFormular';
import { GeburtstageKarte } from './GeburtstageKarte';
import { formatDatum, wochentagName } from '../../lib/dates';
import { schuljahrStartjahr, vollerName } from '../../lib/schuljahr';
import { parseDatum, parseSchuelerZeilen } from '../../lib/schuelerImport';

const GESCHLECHT = [
  { value: '' as const, label: '–' },
  { value: 'w' as const, label: 'weiblich' },
  { value: 'm' as const, label: 'männlich' },
  { value: 'd' as const, label: 'divers' },
];

export default function KlassePage() {
  const { id = '' } = useParams();
  const sj = useAktivesSchuljahr();
  const klasse = useLiveQuery(() => db.klassen.get(id), [id]);
  const schueler = useLiveQuery(() => db.schueler.where('klasseId').equals(id).toArray(), [id], []) ?? [];
  const [bearbeiten, setBearbeiten] = useState(false);
  const [neuesKind, setNeuesKind] = useState(false);
  const [sammel, setSammel] = useState(false);
  const [toast, zeigeToast] = useToast();

  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [geb, setGeb] = useState('');
  const [geschl, setGeschl] = useState<'' | Geschlecht>('');
  const [liste, setListe] = useState('');

  if (!klasse) return <Page title="Klasse" zurueck="/klassen"><Empty>Klasse nicht gefunden.</Empty></Page>;
  const stufe = stufeIm(klasse, sj);
  const sortiert = [...schueler].sort((a, b) => a.nachname.localeCompare(b.nachname, 'de') || a.vorname.localeCompare(b.vorname, 'de'));

  async function kindSpeichern() {
    const datum = parseDatum(geb) ?? geb;
    if (!vorname.trim() || !nachname.trim() || !datum) return;
    await db.schueler.add({ id: neueId(), klasseId: id, vorname: vorname.trim(), nachname: nachname.trim(), geburtsdatum: datum, geschlecht: geschl || undefined });
    setVorname(''); setNachname(''); setGeb(''); setGeschl('');
    setNeuesKind(false);
  }

  const vorschau = parseSchuelerZeilen(liste);
  async function sammelSpeichern() {
    if (!vorschau.ok.length) return;
    await db.schueler.bulkAdd(vorschau.ok.map((k) => ({ id: neueId(), klasseId: id, ...k })));
    zeigeToast(`${vorschau.ok.length} Kinder hinzugefügt`);
    setListe('');
    setSammel(false);
  }

  return (
    <Page title={`Klasse ${klasse.name}`} zurueck="/klassen" aktion={<button onClick={() => setBearbeiten(true)}>Bearbeiten</button>}>
      <Card>
        <div>
          {stufe !== undefined && stufe >= 1 && stufe <= 4 ? <Chip>Klassenstufe {stufe}</Chip> : <Chip kind="gray">außerhalb Klasse 1–4</Chip>}
          {klasse.archiviert ? <Chip kind="warn">archiviert</Chip> : null}
          <Chip kind="gray">{wochentagName(klasse.wochentag)}</Chip>
          {klasse.zusatzAktiv ? <Chip kind="gray">+ alle 2 Wochen {wochentagName(klasse.zusatzWochentag)}</Chip> : null}
        </div>
        <div className="btn-row">
          <Link className="btn small" to={`/plan/${klasse.id}`} style={{ textDecoration: 'none' }}>
            📋 Jahresplan
          </Link>
          <Button small kind="secondary" onClick={async () => { await db.klassen.update(klasse.id, { archiviert: !klasse.archiviert }); }}>
            {klasse.archiviert ? 'Aus Archiv holen' : 'Archivieren'}
          </Button>
        </div>
      </Card>

      <GeburtstageKarte klasseId={klasse.id} />

      <Section
        title={`Kinder (${schueler.length})`}
        aktion={
          <span style={{ display: 'flex', gap: 6 }}>
            <Button small kind="secondary" onClick={() => setSammel(true)}>Liste einfügen</Button>
            <Button small onClick={() => setNeuesKind(true)}>＋ Kind</Button>
          </span>
        }
      >
        {sortiert.length === 0 ? (
          <Empty>Noch keine Kinder. Einzeln hinzufügen oder eine ganze Liste einfügen.</Empty>
        ) : (
          <List>
            {sortiert.map((s) => (
              <Row key={s.id} title={vollerName(s)} sub={`geb. ${formatDatum(s.geburtsdatum)}${s.hinweis ? ' · ' + s.hinweis : ''}`} to={`/schueler/${s.id}`} />
            ))}
          </List>
        )}
      </Section>

      <KlasseFormular offen={bearbeiten} onClose={() => setBearbeiten(false)} klasse={klasse} startjahr={sj ? schuljahrStartjahr(sj.start) : undefined} />

      <Sheet offen={neuesKind} onClose={() => setNeuesKind(false)} titel="Neues Kind">
        <TextField label="Vorname" value={vorname} onChange={setVorname} />
        <TextField label="Name" value={nachname} onChange={setNachname} />
        <TextField label="Geburtsdatum" type="date" value={geb} onChange={setGeb} />
        <div className="muted small">Geschlecht (optional, nur für Bewertungstabellen)</div>
        <ChipAuswahl optionen={GESCHLECHT} wert={geschl} onChange={setGeschl} />
        <div className="btn-row">
          <Button onClick={kindSpeichern} disabled={!vorname.trim() || !nachname.trim() || !geb}>Speichern</Button>
          <Button kind="secondary" onClick={() => setNeuesKind(false)}>Abbrechen</Button>
        </div>
      </Sheet>

      <Sheet offen={sammel} onClose={() => setSammel(false)} titel="Kinderliste einfügen">
        <p className="muted small">Eine Zeile pro Kind: <b>Vorname; Name; TT.MM.JJJJ; w</b> (Geschlecht w/m/d optional). Trennzeichen Semikolon oder Tab, so lässt sich auch eine Tabelle direkt einfügen.</p>
        <TextArea label="Liste" value={liste} onChange={setListe} rows={8} placeholder={'Lea; Müller; 04.03.2018; w\nBen; Koch; 12.12.2017; m'} />
        {liste.trim() ? (
          <div className="small" style={{ marginBottom: 8 }}>
            <div>✅ {vorschau.ok.length} Kinder erkannt</div>
            {vorschau.fehler.map((f) => <div key={f} className="err">{f}</div>)}
          </div>
        ) : null}
        <div className="btn-row">
          <Button onClick={sammelSpeichern} disabled={!vorschau.ok.length}>{vorschau.ok.length} Kinder hinzufügen</Button>
          <Button kind="secondary" onClick={() => setSammel(false)}>Abbrechen</Button>
        </div>
      </Sheet>
      {toast}
    </Page>
  );
}
