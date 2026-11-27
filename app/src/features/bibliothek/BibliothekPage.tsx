import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import type { Ort } from '../../db/types';
import { Button, ChipAuswahl, Empty, List, Page, Row, TextField, useToast } from '../../components/ui';
import { alleTags, filterSpiele } from './filter';
import { ladeStartsammlung } from './startsammlung';
import { formatDatum } from '../../lib/dates';

type Tab = 'spiele' | 'methodik' | 'entwuerfe' | 'notizen';
const TABS: { value: Tab; label: string }[] = [
  { value: 'spiele', label: 'Spiele' },
  { value: 'methodik', label: 'Methodik' },
  { value: 'entwuerfe', label: 'Entwürfe' },
  { value: 'notizen', label: 'Notizen' },
];
const ORT_LABEL: Record<Ort, string> = { halle: 'Halle', draussen: 'Draußen', beides: 'Halle/Draußen' };

export default function BibliothekPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('spiele');
  const [suche, setSuche] = useState('');
  const [ort, setOrt] = useState<Ort | 'alle'>('alle');
  const [fav, setFav] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const [toast, zeigeToast] = useToast();

  const spiele = useLiveQuery(() => db.spiele.toArray(), [], []) ?? [];
  const reihen = useLiveQuery(() => db.reihen.toArray(), [], []) ?? [];
  const entwuerfe = useLiveQuery(() => db.entwuerfe.toArray(), [], []) ?? [];
  const notizen = useLiveQuery(() => db.notizen.toArray(), [], []) ?? [];
  const lernbereiche = useLiveQuery(() => db.lernbereiche.toArray(), [], []) ?? [];
  const zuletzt = useLiveQuery(async () => {
    const m = new Map<string, string>();
    for (const e of await db.einheiten.toArray()) {
      if (e.status !== 'gehalten') continue;
      for (const id of e.spielIds) if (!m.get(id) || m.get(id)! < e.datum) m.set(id, e.datum);
    }
    return m;
  }, [], new Map<string, string>());

  const gefiltert = filterSpiele(spiele, { suche, ort, nurFavoriten: fav, tag });
  const tags = alleTags(spiele);

  async function neuesSpiel() {
    const id = neueId();
    await db.spiele.add({ id, titel: 'Neues Spiel', beschreibung: '', material: '', ort: 'beides', ziele: [], quelle: '', favorit: false, erstellt: Date.now() });
    nav(`/spiel/${id}`);
  }
  async function neueReihe() {
    const id = neueId();
    await db.reihen.add({ id, thema: 'Neue Reihe', schritte: [], sicherheit: '', quelle: '', erstellt: Date.now() });
    nav(`/reihe/${id}`);
  }
  async function neueNotiz() {
    const id = neueId();
    await db.notizen.add({ id, titel: 'Neue Notiz', text: '', erstellt: Date.now() });
    nav(`/notiz/${id}`);
  }

  async function neuerEntwurf() {
    const id = neueId();
    await db.entwuerfe.add({ id, titel: 'Neuer Entwurf', zielIds: [], spielIds: [], reiheIds: [], aufwaermen: '', hauptteil: '', ausklang: '', material: '', wetterAlternative: '', erstellt: Date.now() });
    nav(`/entwurf/${id}`);
  }

  const aktion =
    tab === 'spiele' ? <button onClick={neuesSpiel}>＋ Spiel</button> : tab === 'methodik' ? <button onClick={neueReihe}>＋ Reihe</button> : tab === 'entwuerfe' ? <button onClick={neuerEntwurf}>＋ Entwurf</button> : <button onClick={neueNotiz}>＋ Notiz</button>;

  return (
    <Page title="Bibliothek" aktion={aktion}>
      <ChipAuswahl optionen={TABS} wert={tab} onChange={setTab} />

      {tab === 'spiele' ? (
        <>
          {spiele.length === 0 ? (
            <Empty>
              Noch keine Spiele. Lege eigene an oder lade eine kleine Startsammlung (in eigenen Worten, frei änderbar).
              <div className="btn-row" style={{ justifyContent: 'center' }}>
                <Button onClick={async () => zeigeToast(`${await ladeStartsammlung()} Einträge geladen`)}>Startsammlung laden</Button>
              </div>
            </Empty>
          ) : (
            <>
              <TextField label="Suchen" type="search" value={suche} onChange={setSuche} placeholder="Titel, Material, Schlagwort …" />
              <div className="chips">
                <button className={`chip-btn ${fav ? 'on' : ''}`} onClick={() => setFav(!fav)}>★ Favoriten</button>
                {(['halle', 'draussen'] as Ort[]).map((o) => (
                  <button key={o} className={`chip-btn ${ort === o ? 'on' : ''}`} onClick={() => setOrt(ort === o ? 'alle' : o)}>{ORT_LABEL[o]}</button>
                ))}
                {tags.map((t) => (
                  <button key={t} className={`chip-btn ${tag === t ? 'on' : ''}`} onClick={() => setTag(tag === t ? null : t)}>{t}</button>
                ))}
              </div>
              {gefiltert.length === 0 ? <Empty>Kein Spiel gefunden.</Empty> : (
                <List>
                  {gefiltert.map((s) => {
                    const z = zuletzt?.get(s.id);
                    const info = [s.dauerMin ? `${s.dauerMin} min` : '', s.gruppeMin || s.gruppeMax ? `${s.gruppeMin ?? ''}–${s.gruppeMax ?? ''} Kinder` : '', ORT_LABEL[s.ort]].filter(Boolean).join(' · ');
                    return <Row key={s.id} title={`${s.favorit ? '★ ' : ''}${s.titel}`} sub={`${info}${z ? ' · zuletzt ' + formatDatum(z) : ''}`} to={`/spiel/${s.id}`} />;
                  })}
                </List>
              )}
            </>
          )}
        </>
      ) : null}

      {tab === 'methodik' ? (
        reihen.length === 0 ? (
          <Empty>
            Noch keine methodischen Reihen.
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <Button onClick={async () => zeigeToast(`${await ladeStartsammlung()} Einträge geladen`)}>Startsammlung laden</Button>
            </div>
          </Empty>
        ) : (
          <List>
            {[...reihen].sort((a, b) => a.thema.localeCompare(b.thema, 'de')).map((r) => (
              <Row key={r.id} title={r.thema} sub={`${r.schritte.length} Schritte${r.lernbereichId ? ' · ' + (lernbereiche.find((l) => l.id === r.lernbereichId)?.kuerzel ?? '') : ''}`} to={`/reihe/${r.id}`} />
            ))}
          </List>
        )
      ) : null}

      {tab === 'entwuerfe' ? (
        entwuerfe.length === 0 ? <Empty>Noch keine Entwürfe. In einer Einheit kannst du den Stundeninhalt „Als Entwurf speichern“, um ihn in einem späteren Jahr oder bei einer anderen Klasse wiederzuverwenden.</Empty> : (
          <List>
            {[...entwuerfe].sort((a, b) => a.titel.localeCompare(b.titel, 'de')).map((d) => (
              <Row key={d.id} title={d.titel || 'Ohne Titel'} sub={[d.klassenstufe ? `Klasse ${d.klassenstufe}` : '', lernbereiche.find((l) => l.id === d.lernbereichId)?.kuerzel ?? '', d.hauptteil.slice(0, 50)].filter(Boolean).join(' · ')} to={`/entwurf/${d.id}`} />
            ))}
          </List>
        )
      ) : null}

      {tab === 'notizen' ? (
        notizen.length === 0 ? <Empty>Noch keine Notizen.</Empty> : (
          <List>
            {[...notizen].sort((a, b) => b.erstellt - a.erstellt).map((n) => (
              <Row key={n.id} title={n.titel || 'Ohne Titel'} sub={n.text.slice(0, 80)} to={`/notiz/${n.id}`} />
            ))}
          </List>
        )
      ) : null}
      {toast}
    </Page>
  );
}
