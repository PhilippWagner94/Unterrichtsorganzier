// Testergebnisse, Bestleistungen und Noten eines Kindes (Schüler-Detailseite).
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Card, Empty, Section } from '../../components/ui';
import { bestleistung, durchschnitt, formatNote } from '../../lib/noten';
import { formatWert, fortschritt, juengstes } from './auswertung';

export function SchuelerLeistungen({ schuelerId }: { schuelerId: string }) {
  const tests = useLiveQuery(() => db.tests.toArray(), [], []) ?? [];
  const erg = useLiveQuery(() => db.testergebnisse.where('schuelerId').equals(schuelerId).toArray(), [schuelerId], []) ?? [];
  const datum = (d: string) => d.split('-').reverse().join('.');
  const mitErgebnis = tests.filter((t) => erg.some((e) => e.testId === t.id));
  const noten = mitErgebnis.map((t) => juengstes(erg.filter((e) => e.testId === t.id))?.note).filter((n): n is number => n !== undefined);
  const schnitt = durchschnitt(noten);

  return (
    <>
      <Section title="Leistungen" />
      {mitErgebnis.length === 0 ? <Empty>Noch keine Testergebnisse.</Empty> : null}
      {mitErgebnis.map((t) => {
        const liste = erg.filter((e) => e.testId === t.id);
        const letzt = juengstes(liste)!;
        const best = bestleistung(t, liste);
        const fort = fortschritt(t, liste);
        return (
          <Card key={t.id}>
            <strong>{t.name}</strong>
            <div className="small">
              Zuletzt ({datum(letzt.datum)}): {formatWert(letzt.wert, t.einheit)}
              {letzt.note !== undefined ? ` · Note ${formatNote(letzt.note)}` : ''}
              {letzt.verbal ? ` · ${letzt.verbal}` : ''}
            </div>
            {best ? <div className="muted small">Bestleistung: {formatWert(best.wert, t.einheit)}</div> : null}
            {fort !== undefined ? <div className="muted small">Entwicklung: {fort > 0 ? '+' : ''}{formatWert(fort, t.einheit)}</div> : null}
          </Card>
        );
      })}
      {schnitt !== undefined ? <div className="muted small">Durchschnitt der letzten Noten: {formatNote(schnitt)}</div> : null}
    </>
  );
}
