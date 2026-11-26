import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { stufeIm, useAktivesSchuljahr, useKlassenAktiv } from '../../db/hooks';
import { Empty, Page, SelectField } from '../../components/ui';
import { durchschnitt, formatNote } from '../../lib/noten';
import { vollerName } from '../../lib/schuljahr';
import { formatWert, juengstePro } from './auswertung';

export default function NotenPage() {
  const klassen = useKlassenAktiv();
  const sj = useAktivesSchuljahr();
  const [klasseId, setKlasseId] = useState('');
  useEffect(() => {
    if (!klasseId && klassen.length) setKlasseId(klassen[0].klasse.id);
  }, [klassen.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const tests = useLiveQuery(() => db.tests.toArray(), [], []) ?? [];
  const kinder = useLiveQuery(() => (klasseId ? db.schueler.where('klasseId').equals(klasseId).toArray() : []), [klasseId], []) ?? [];
  const erg = useLiveQuery(() => db.testergebnisse.toArray(), [], []) ?? [];

  const klasse = klassen.find((k) => k.klasse.id === klasseId)?.klasse;
  const stufe = klasse ? stufeIm(klasse, sj) ?? 1 : 1;
  const ids = new Set(kinder.map((k) => k.id));
  const juengste = juengstePro(erg.filter((e) => ids.has(e.schuelerId)), (e) => `${e.schuelerId}|${e.testId}`);
  const genutzte = tests.filter((t) => [...juengste.keys()].some((k) => k.endsWith(`|${t.id}`)));

  return (
    <Page title="Noten" zurueck>
      {klassen.length === 0 ? <Empty>Noch keine Klasse.</Empty> : (
        <SelectField label="Klasse" value={klasseId} onChange={setKlasseId} options={klassen.map((k) => ({ value: k.klasse.id, label: `Klasse ${k.klasse.name}` }))} />
      )}
      {stufe === 1 ? <div className="muted small" style={{ marginBottom: 8 }}>Klasse 1: verbale Beurteilung, Noten nur zur Orientierung.</div> : null}
      {genutzte.length === 0 && klasseId ? <Empty>Noch keine Ergebnisse. Erfasse sie unter Tests.</Empty> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="tabelle">
            <thead>
              <tr>
                <th>Kind</th>
                {genutzte.map((t) => <th key={t.id}><Link to={`/test/${t.id}`}>{t.name}</Link></th>)}
                <th>Ø</th>
              </tr>
            </thead>
            <tbody>
              {[...kinder].sort((a, b) => a.nachname.localeCompare(b.nachname, 'de')).map((k) => {
                const noten: number[] = [];
                return (
                  <tr key={k.id}>
                    <td><Link to={`/schueler/${k.id}`}>{vollerName(k)}</Link></td>
                    {genutzte.map((t) => {
                      const e = juengste.get(`${k.id}|${t.id}`);
                      if (e?.note !== undefined) noten.push(e.note);
                      return <td key={t.id}>{e ? `${e.wert !== undefined ? formatWert(e.wert, t.einheit) : ''}${e.note !== undefined ? ` (${formatNote(e.note)})` : ''}${e.verbal && e.wert === undefined && e.note === undefined ? '✎' : ''}` : '–'}</td>;
                    })}
                    <td><strong>{formatNote(durchschnitt(noten))}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
