import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import { Empty, List, Page, Row, Section } from '../../components/ui';

const TYP_LABEL = { messwert: 'Messwert', note: 'Note', verbal: 'Verbal', punkte: 'Punkte' } as const;

export default function TestsPage() {
  const nav = useNavigate();
  const tests = useLiveQuery(() => db.tests.toArray(), [], []) ?? [];
  const lbs = useLiveQuery(() => db.lernbereiche.toArray(), [], []) ?? [];
  const anzahl = useLiveQuery(async () => {
    const m = new Map<string, number>();
    for (const e of await db.testergebnisse.toArray()) m.set(e.testId, (m.get(e.testId) ?? 0) + 1);
    return m;
  }, [], new Map<string, number>());

  async function neu() {
    const id = neueId();
    await db.tests.add({ id, name: 'Neuer Test', typ: 'messwert', einheit: 's', richtung: 'min', tabelle: [], beschreibung: '' });
    nav(`/test/${id}`);
  }

  return (
    <Page title="Tests" zurueck aktion={<button onClick={neu}>＋ Test</button>}>
      {tests.length === 0 ? <Empty>Noch keine Tests.</Empty> : (
        <List>
          {[...tests].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((t) => (
            <Row key={t.id} to={`/test/${t.id}`} title={t.name} sub={`${lbs.find((l) => l.id === t.lernbereichId)?.kuerzel ? lbs.find((l) => l.id === t.lernbereichId)!.kuerzel + ' · ' : ''}${TYP_LABEL[t.typ]}${t.einheit ? ' · ' + t.einheit : ''} · ${anzahl?.get(t.id) ?? 0} Ergebnisse`} />
          ))}
        </List>
      )}
      <Section title="Auswertung" />
      <List>
        <Row title="📊 Notenübersicht" sub="Ergebnisse und Durchschnitt pro Klasse" to="/noten" />
      </List>
    </Page>
  );
}
