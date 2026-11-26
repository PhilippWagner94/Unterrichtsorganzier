import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { aktiveKlassen, useAktivesSchuljahr } from '../../db/hooks';
import { Button, Empty, List, Page, Row, Section } from '../../components/ui';
import { KlasseFormular } from './KlasseFormular';
import { schuljahrStartjahr } from '../../lib/schuljahr';

export default function KlassenPage() {
  const nav = useNavigate();
  const sj = useAktivesSchuljahr();
  const klassen = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const schueler = useLiveQuery(() => db.schueler.toArray(), [], []) ?? [];
  const [neu, setNeu] = useState(false);

  const aktiv = aktiveKlassen(klassen, sj);
  const aktivIds = new Set(aktiv.map((a) => a.klasse.id));
  const sonstige = klassen.filter((k) => !aktivIds.has(k.id));
  const anzahl = (id: string) => schueler.filter((s) => s.klasseId === id).length;

  return (
    <Page title="Klassen" aktion={<button onClick={() => setNeu(true)}>＋ Klasse</button>}>
      {sj ? <div className="muted small">Schuljahr {sj.name}</div> : null}
      {aktiv.length === 0 ? (
        <Empty>
          Noch keine Klasse angelegt.
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <Button onClick={() => setNeu(true)}>Erste Klasse anlegen</Button>
          </div>
        </Empty>
      ) : (
        <List>
          {aktiv.map(({ klasse, stufe }) => (
            <Row
              key={klasse.id}
              title={`Klasse ${klasse.name}`}
              sub={`Stufe ${stufe} · ${anzahl(klasse.id)} Kinder`}
              to={`/klasse/${klasse.id}`}
            />
          ))}
        </List>
      )}
      {sonstige.length ? (
        <Section title="Archiv und nicht aktive Klassen">
          <List>
            {sonstige.map((k) => (
              <Row
                key={k.id}
                title={`Klasse ${k.name}`}
                sub={`${anzahl(k.id)} Kinder${k.archiviert ? ' · archiviert' : ' · außerhalb Klasse 1–4'}`}
                to={`/klasse/${k.id}`}
              />
            ))}
          </List>
        </Section>
      ) : null}
      <KlasseFormular
        offen={neu}
        onClose={() => setNeu(false)}
        startjahr={sj ? schuljahrStartjahr(sj.start) : undefined}
        onGespeichert={(k) => nav(`/klasse/${k.id}`)}
      />
    </Page>
  );
}
