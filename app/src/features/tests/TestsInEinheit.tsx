import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Einheit, EinheitTest } from '../../db/types';
import { Button, Card, Section, SelectField } from '../../components/ui';
import { fehlendeKinder } from '../../lib/offeneTests';
import { vollerName } from '../../lib/schuljahr';

/** Abschnitt in der Einheit: welche Tests/Noten wurden hier gemacht, und wer fehlt noch? */
export function TestsInEinheit({ e, set }: { e: Einheit; set: (p: Partial<Einheit>) => void }) {
  const tests = useLiveQuery(() => db.tests.toArray(), [], []) ?? [];
  const schueler = useLiveQuery(() => db.schueler.where('klasseId').equals(e.klasseId).toArray(), [e.klasseId], []) ?? [];
  const ergebnisse = useLiveQuery(() => db.testergebnisse.toArray(), [], []) ?? [];
  const liste = e.tests ?? [];
  const frei = tests.filter((t) => !liste.some((x) => x.testId === t.id));
  const aendere = (testId: string, patch: Partial<EinheitTest>) => set({ tests: liste.map((x) => (x.testId === testId ? { ...x, ...patch } : x)) });

  return (
    <>
      <Section title="Tests und Noten in dieser Einheit" />
      {liste.length === 0 ? <div className="muted small" style={{ marginBottom: 8 }}>Kein Test eingetragen.</div> : null}
      {liste.map((x) => {
        const t = tests.find((y) => y.id === x.testId);
        if (!t) return null;
        const fehlend = fehlendeKinder(e, x.testId, schueler, ergebnisse);
        const erfasst = schueler.filter((s) => !fehlend.includes(s)).length;
        return (
          <Card key={x.testId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong>{t.name}</strong>
              <Button small kind="secondary" onClick={() => set({ tests: liste.filter((y) => y.testId !== x.testId) })}>✕</Button>
            </div>
            <div className="small">{x.abgeschlossen ? 'Abgeschlossen' : `${erfasst} von ${schueler.length} Kindern erfasst`}</div>
            {fehlend.length ? (
              <div style={{ marginTop: 6 }}>
                <div className="muted small">Noch offen:</div>
                {fehlend.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <span>{vollerName(s)}</span>
                    <Button small kind="secondary" onClick={() => aendere(x.testId, { ausgenommen: [...x.ausgenommen, s.id] })}>nicht nachholen</Button>
                  </div>
                ))}
                <Button small kind="secondary" onClick={() => aendere(x.testId, { abgeschlossen: true })}>Alles abschließen</Button>
              </div>
            ) : null}
            {x.abgeschlossen ? <Button small kind="secondary" onClick={() => aendere(x.testId, { abgeschlossen: false })}>Wieder öffnen</Button> : null}
            <div className="btn-row">
              <Link className="btn small" to={`/test/${t.id}?klasse=${e.klasseId}&datum=${e.datum}`} style={{ textDecoration: 'none' }}>Ergebnisse erfassen</Link>
            </div>
          </Card>
        );
      })}
      {frei.length ? (
        <SelectField
          label="Test hinzufügen"
          value=""
          onChange={(v) => v && set({ tests: [...liste, { testId: v, ausgenommen: [] }] })}
          options={[{ value: '', label: '– Test wählen –' }, ...frei.map((t) => ({ value: t.id, label: t.name }))]}
        />
      ) : (
        <div className="muted small">Neue Tests legst du unter Mehr → Tests an.</div>
      )}
    </>
  );
}
