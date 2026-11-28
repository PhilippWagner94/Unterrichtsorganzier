import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Zeiteintrag } from '../../db/types';
import { Button, Chip, Empty, Page } from '../../components/ui';
import { addTage, formatLang, heute, isoWoche, wochentag } from '../../lib/dates';
import { aufgabenAm, verpflichtungenAm, ART_LABEL } from '../../lib/aufgaben';
import { freiBezeichnung } from '../../lib/plan';
import { aufgabeZeit, einheitZeit, formatDauer, spanne, toMin } from '../../lib/zeit';
import { minuten } from '../../lib/arbeitszeit';
import { ZeitSheet } from './ZeitSheet';
import { useZeitEinstellungen, useZeitKategorien } from './zeitDaten';

interface Eintrag {
  sort: number;
  zeit?: string;
  titel: string;
  sub?: string;
  icon: string;
  to?: string;
  onClick?: () => void;
}

/** Tagesplan: alles, was an einem Tag mit Uhrzeit ansteht – Unterricht, Aufsichten, Termine, erfasste Vor- und Nachbereitung. */
export default function TagPage() {
  const { datum = heute() } = useParams();
  const nav = useNavigate();
  const einst = useZeitEinstellungen();
  const kategorien = useZeitKategorien();
  const einheiten = useLiveQuery(() => db.einheiten.where('datum').equals(datum).toArray(), [datum], []) ?? [];
  const klassen = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const aufgaben = useLiveQuery(() => db.aufgaben.toArray(), [], []) ?? [];
  const freie = useLiveQuery(() => db.freieTage.toArray(), [], []) ?? [];
  const zeiten = useLiveQuery(() => db.zeiten.where('datum').equals(datum).toArray(), [datum], []) ?? [];
  const wk = useLiveQuery(() => db.wettkaempfe.where('datum').equals(datum).toArray(), [datum], []) ?? [];
  const [sheet, setSheet] = useState<{ eintrag?: Zeiteintrag } | null>(null);
  const kName = (id: string) => kategorien.find((k) => k.id === id)?.name ?? '';
  const kl = (id: string) => klassen.find((k) => k.id === id);
  const frei = freiBezeichnung(datum, freie);

  const liste: Eintrag[] = [];
  for (const e of einheiten.filter((x) => x.status !== 'verschoben')) {
    const t = einheitZeit(e, kl(e.klasseId), einst.doppelMin);
    liste.push({
      sort: toMin(t?.von) ?? 9999, zeit: t ? spanne(t.von, t.bis) : undefined, icon: '🏃', to: `/einheit/${e.id}`,
      titel: `Sport · Klasse ${kl(e.klasseId)?.name ?? '?'}${e.zusatz ? ' (Zusatz)' : ''}`,
      sub: e.status === 'ausfall' ? `Ausfall${e.ausfallGrund ? ': ' + e.ausfallGrund : ''}` : e.status === 'vertretung' ? 'Vertretung' : e.titel || (t ? undefined : 'Uhrzeit bei der Klasse eintragen'),
    });
  }
  for (const v of verpflichtungenAm(aufgaben, datum, freie)) {
    const t = aufgabeZeit(v);
    liste.push({ sort: toMin(t?.von) ?? 9998, zeit: t ? spanne(t.von, t.bis) : undefined, icon: '🕒', titel: v.titel, sub: [v.art ? ART_LABEL[v.art] : '', v.ort].filter(Boolean).join(' · '), to: '/aufgaben' });
  }
  for (const w of wk) liste.push({ sort: 9997, icon: '🏆', titel: w.name, sub: w.ort, to: `/wettkampf/${w.id}` });
  for (const z of zeiten.filter((x) => !x.bezugTyp)) {
    liste.push({ sort: toMin(z.von) ?? 0, zeit: spanne(z.von, z.bis), icon: '⏱', titel: kName(z.kategorieId), sub: `${formatDauer(minuten(z))}${z.notiz ? ' · ' + z.notiz : ''}`, onClick: () => setSheet({ eintrag: z }) });
  }
  for (const a of aufgabenAm(aufgaben, datum)) liste.push({ sort: 10000, icon: '☐', titel: a.titel, sub: 'Aufgabe', to: '/aufgaben' });
  liste.sort((a, b) => a.sort - b.sort);

  return (
    <Page title={`${formatLang(datum)}`} zurueck>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <Button small kind="secondary" onClick={() => nav(`/tag/${addTage(datum, -1)}`, { replace: true })}>‹ Vortag</Button>
        <span className="muted small">KW {isoWoche(datum)}</span>
        <Button small kind="secondary" onClick={() => nav(`/tag/${addTage(datum, 1)}`, { replace: true })}>Folgetag ›</Button>
      </div>
      {frei ? <Chip kind="gray">{frei}</Chip> : null}
      {!frei && wochentag(datum) <= 5 ? <div className="card soft small" style={{ margin: '8px 0', padding: 10 }}>🏫 In der Schule: {einst.schuleVon}–{einst.schuleBis}</div> : null}

      {liste.length === 0 ? <Empty>Für diesen Tag ist nichts eingetragen.</Empty> : (
        <div className="list">
          {liste.map((x, i) => {
            const inhalt = (
              <>
                <span style={{ width: 92, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }} className="small">{x.zeit ?? 'ohne Zeit'}</span>
                <div className="main">
                  <div className="title">{x.icon} {x.titel}</div>
                  {x.sub ? <div className="sub">{x.sub}</div> : null}
                </div>
              </>
            );
            return x.to ? (
              <Link key={i} className="row" to={x.to} style={{ textDecoration: 'none', color: 'inherit' }}>{inhalt}</Link>
            ) : (
              <button key={i} className="row" onClick={x.onClick} style={{ width: '100%', textAlign: 'left' }}>{inhalt}</button>
            );
          })}
        </div>
      )}
      <div className="btn-row">
        <Button onClick={() => setSheet({})}>＋ Vor-/Nachbereitung eintragen</Button>
        <Link className="btn secondary small" to="/arbeitszeit" style={{ textDecoration: 'none' }}>Arbeitszeit</Link>
      </div>
      <ZeitSheet offen={sheet !== null} onClose={() => setSheet(null)} eintrag={sheet?.eintrag} vorgabe={{ datum, von: einst.schuleBis, bis: einst.schuleBis ? undefined : undefined }} />
    </Page>
  );
}
