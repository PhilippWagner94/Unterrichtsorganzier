import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Aufgabe } from '../../db/types';
import { Button, Chip, Section } from '../../components/ui';
import { addTage, formatLang, heute } from '../../lib/dates';
import { aufgabenAm, ueberfaellig, verpflichtungenAm } from '../../lib/aufgaben';
import { aufgabeZeit, einheitZeit, toMin } from '../../lib/zeit';
import { freiBezeichnung } from '../../lib/plan';
import { AufgabeSheet, type AufgabeVorgabe } from './AufgabeSheet';
import { AufgabeZeile } from './AufgabeZeile';
import { useZeitEinstellungen } from '../arbeitszeit/zeitDaten';

export const ZEITRAEUME: [number, string][] = [[0, 'Heute'], [3, '3 Tage'], [7, '1 Woche'], [14, '2 Wochen']];

/** Tag-für-Tag-Übersicht: Unterricht, Verpflichtungen (nach Uhrzeit) und fällige Aufgaben. Wird auf „Heute“ und auf der Aufgabenseite genutzt. */
export function AufgabenUebersicht({ tage }: { tage: number }) {
  const h = heute();
  const einst = useZeitEinstellungen();
  const alle = useLiveQuery(() => db.aufgaben.toArray(), [], []) ?? [];
  const einheiten = useLiveQuery(() => db.einheiten.where('datum').between(h, addTage(h, 14), true, true).toArray(), [h], []) ?? [];
  const klassenListe = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const freieTage = useLiveQuery(() => db.freieTage.toArray(), [], []) ?? [];
  const [sheet, setSheet] = useState<{ aufgabe?: Aufgabe; vorgabe?: AufgabeVorgabe } | null>(null);
  const klassen = new Map(klassenListe.map((k) => [k.id, k.name]));
  const ueber = ueberfaellig(alle, h);

  return (
    <>
      {ueber.length ? (
        <Section title="Überfällig">
          <div className="list">{ueber.map((a) => <AufgabeZeile key={a.id} a={a} klassen={klassen} onEdit={() => setSheet({ aufgabe: a })} />)}</div>
        </Section>
      ) : null}

      {Array.from({ length: tage + 1 }, (_, i) => addTage(h, i)).map((d, i) => {
        const v = verpflichtungenAm(alle, d, freieTage);
        const a = aufgabenAm(alle, d);
        const u = einheiten.filter((e) => e.datum === d && e.status === 'geplant');
        const frei = freiBezeichnung(d, freieTage);
        if (!v.length && !a.length && !u.length && !(frei && i === 0)) return null;
        const zeilen: { sort: number; el: JSX.Element }[] = [];
        for (const e of u) {
          const t = einheitZeit(e, klassenListe.find((k) => k.id === e.klasseId), einst.doppelMin);
          zeilen.push({
            sort: toMin(t?.von) ?? 9000,
            el: (
              <div key={e.id} className="row">
                <span style={{ marginRight: 10 }}>🏃</span>
                <Link className="main" to={`/einheit/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="title">{t ? `${t.von}–${t.bis} · ` : ''}Sport · Klasse {klassen.get(e.klasseId)}</div>
                  <div className="sub">{e.titel || 'Unterricht'}</div>
                </Link>
                <Button small kind="secondary" onClick={() => setSheet({ vorgabe: { typ: 'aufgabe', faellig: addTage(d, -1) < h ? h : addTage(d, -1), einheitId: e.id, klasseId: e.klasseId, kategorie: 'vorbereitung', titel: 'Vorbereiten: ' } })}>＋ Vorbereitung</Button>
              </div>
            ),
          });
        }
        for (const x of v) zeilen.push({ sort: toMin(aufgabeZeit(x)?.von) ?? 9500, el: <AufgabeZeile key={x.id + d} a={x} klassen={klassen} onEdit={() => setSheet({ aufgabe: x })} /> });
        for (const x of a) zeilen.push({ sort: 10000, el: <AufgabeZeile key={x.id} a={x} klassen={klassen} onEdit={() => setSheet({ aufgabe: x })} /> });
        zeilen.sort((p, q) => p.sort - q.sort);
        return (
          <Section key={d} title={`${d === h ? 'Heute · ' : d === addTage(h, 1) ? 'Morgen · ' : ''}${formatLang(d)}`}>
            {frei ? <Chip kind="gray">{frei}</Chip> : null}
            <div className="list">{zeilen.map((z) => z.el)}</div>
          </Section>
        );
      })}
      <AufgabeSheet offen={sheet !== null} onClose={() => setSheet(null)} aufgabe={sheet?.aufgabe} vorgabe={sheet?.vorgabe} />
    </>
  );
}
