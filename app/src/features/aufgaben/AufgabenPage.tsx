import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Aufgabe } from '../../db/types';
import { Button, Card, Chip, Empty, Page, Section } from '../../components/ui';
import { addTage, formatLang, heute, wochentag } from '../../lib/dates';
import { ART_LABEL, KATEGORIE_LABEL, aufgabenAm, ohneDatum, ueberfaellig, verpflichtungenAm } from '../../lib/aufgaben';
import { aufgabeZeit, spanne } from '../../lib/zeit';
import { freiBezeichnung } from '../../lib/plan';
import { AufgabeSheet, type AufgabeVorgabe } from './AufgabeSheet';
import { AufgabeZeile } from './AufgabeZeile';
import { AufgabenUebersicht } from './Uebersicht';
import { WettkampfChecklisten } from '../wettkaempfe/WettkampfChecklisten';

export default function AufgabenPage() {
  const h = heute();
  const alle = useLiveQuery(() => db.aufgaben.toArray(), [], []) ?? [];
  const einheiten = useLiveQuery(() => db.einheiten.where('datum').between(h, addTage(h, 14), true, true).toArray(), [h], []) ?? [];
  const klassenListe = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const freieTage = useLiveQuery(() => db.freieTage.toArray(), [], []) ?? [];
  const [tage, setTage] = useState(7);
  const [sheet, setSheet] = useState<{ aufgabe?: Aufgabe; vorgabe?: AufgabeVorgabe } | null>(null);
  const [zeigeErledigt, setZeigeErledigt] = useState(false);
  const klassen = new Map(klassenListe.map((k) => [k.id, k.name]));

  const spaeter = alle.filter((a) => a.typ === 'aufgabe' && !a.erledigt && a.faellig && a.faellig > addTage(h, tage));
  const erledigt = alle.filter((a) => a.typ === 'aufgabe' && a.erledigt).sort((a, b) => (b.erledigtAm ?? '').localeCompare(a.erledigtAm ?? '')).slice(0, 20);
  const regelmaessig = alle.filter((a) => a.typ === 'verpflichtung' && (a.wiederholung ?? 'einmalig') !== 'einmalig');
  const ueber = ueberfaellig(alle, h);
  const ohne = ohneDatum(alle);

  const tageListe = Array.from({ length: tage + 1 }, (_, i) => addTage(h, i));

  return (
    <Page title="Aufgaben" zurueck>
      <div className="btn-row">
        <Button onClick={() => setSheet({ vorgabe: { typ: 'aufgabe' } })}>＋ Aufgabe</Button>
        <Button kind="secondary" onClick={() => setSheet({ vorgabe: { typ: 'verpflichtung' } })}>＋ Aufsicht / Termin</Button>
      </div>
      <div className="chips" style={{ margin: '8px 0' }}>
        {[[3, '3 Tage'], [7, '1 Woche'], [14, '2 Wochen']].map(([n, l]) => (
          <button key={n} className={`chip-btn ${tage === n ? 'on' : ''}`} onClick={() => setTage(n as number)}>{l}</button>
        ))}
      </div>

      <AufgabenUebersicht tage={tage} />
      <WettkampfChecklisten />

      {ohne.length ? (
        <Section title="Ohne Datum">
          <div className="list">{ohne.map((a) => <AufgabeZeile key={a.id} a={a} klassen={klassen} onEdit={() => setSheet({ aufgabe: a })} />)}</div>
        </Section>
      ) : null}
      {spaeter.length ? (
        <Section title="Später">
          <div className="list">{spaeter.sort((a, b) => a.faellig!.localeCompare(b.faellig!)).map((a) => (
            <div key={a.id}><div className="muted small">{formatLang(a.faellig!)}</div><AufgabeZeile a={a} klassen={klassen} onEdit={() => setSheet({ aufgabe: a })} /></div>
          ))}</div>
        </Section>
      ) : null}

      {regelmaessig.length ? (
        <Section title="Regelmäßige Verpflichtungen">
          <div className="list">
            {regelmaessig.map((a) => (
              <div key={a.id}>
                <div className="muted small">{['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'][a.wochentag ?? 1]}{a.wiederholung === 'zweiwoechentlich' ? `, ${a.woche === 'gerade' ? 'gerade' : 'ungerade'} KW` : ', jede Woche'}{a.art ? ` · ${ART_LABEL[a.art]}` : ''}</div>
                <AufgabeZeile a={a} klassen={klassen} onEdit={() => setSheet({ aufgabe: a })} />
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {alle.length === 0 ? <Empty>Noch nichts eingetragen. Lege Aufgaben (z. B. „Material für Do kopieren“) oder Verpflichtungen (Hofaufsicht, Dienstberatung, Elterngespräch) an.</Empty> : null}

      {erledigt.length ? (
        <>
          <Button small kind="secondary" onClick={() => setZeigeErledigt(!zeigeErledigt)}>{zeigeErledigt ? 'Erledigte ausblenden' : `Erledigte zeigen (${erledigt.length})`}</Button>
          {zeigeErledigt ? <Card><div className="list">{erledigt.map((a) => <AufgabeZeile key={a.id} a={a} klassen={klassen} onEdit={() => setSheet({ aufgabe: a })} />)}</div></Card> : null}
        </>
      ) : null}

      <AufgabeSheet offen={sheet !== null} onClose={() => setSheet(null)} aufgabe={sheet?.aufgabe} vorgabe={sheet?.vorgabe} />
    </Page>
  );
}
