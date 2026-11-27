import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { aktiveKlassen, useAktivesSchuljahr } from '../../db/hooks';
import { Button, Card, Chip, Empty, List, Page, Row, Section } from '../../components/ui';
import { GeburtstageKarte } from '../klassen/GeburtstageKarte';
import { addTage, formatLang, heute, tageZwischen } from '../../lib/dates';
import { freiBezeichnung } from '../../lib/plan';
import { planNeuVerteilen } from '../../lib/planAktionen';
import { letztesBackup } from '../../db/backup';
import type { Einheit } from '../../db/types';
import { aufgabenAm, ueberfaellig, verpflichtungenAm } from '../../lib/aufgaben';
import { aufgabeZeit, einheitZeit, spanne } from '../../lib/zeit';
import { offeneTests } from '../../lib/offeneTests';
import { vollerName } from '../../lib/schuljahr';

export default function HeutePage() {
  const nav = useNavigate();
  const h = heute();
  const sj = useAktivesSchuljahr();
  const klassen = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const einheiten = useLiveQuery(() => db.einheiten.toArray(), [], []) ?? [];
  const lernbereiche = useLiveQuery(() => db.lernbereiche.toArray(), [], []) ?? [];
  const wettkaempfe = useLiveQuery(() => db.wettkaempfe.toArray(), [], []) ?? [];
  const freieTage = useLiveQuery(() => db.freieTage.toArray(), [], []) ?? [];
  const backup = useLiveQuery(() => letztesBackup(), [], null);
  const schuelerAnzahl = useLiveQuery(() => db.schueler.count(), [], 0) ?? 0;

  const tests = useLiveQuery(() => db.tests.toArray(), [], []) ?? [];
  const alleSchueler = useLiveQuery(() => db.schueler.toArray(), [], []) ?? [];
  const ergebnisse = useLiveQuery(() => db.testergebnisse.toArray(), [], []) ?? [];
  const aktiv = aktiveKlassen(klassen, sj);
  const offen = offeneTests(einheiten.filter((e) => aktiv.some((a) => a.klasse.id === e.klasseId)), tests, alleSchueler, ergebnisse, h);
  const aufgaben = useLiveQuery(() => db.aufgaben.toArray(), [], []) ?? [];
  const aufHeute = [...ueberfaellig(aufgaben, h), ...aufgabenAm(aufgaben, h)];
  const aufMorgen = aufgabenAm(aufgaben, addTage(h, 1));
  const verpfHeute = verpflichtungenAm(aufgaben, h, freieTage);
  const klasseName = (id: string) => klassen.find((k) => k.id === id)?.name ?? '';
  const lbName = (e: Einheit) => (e.istPuffer ? 'Pufferstunde' : lernbereiche.find((l) => l.id === e.lernbereichId)?.name ?? '');
  const heutige = einheiten.filter((e) => e.datum === h && aktiv.some((a) => a.klasse.id === e.klasseId));
  const kommendeWk = wettkaempfe.filter((w) => w.datum >= h && w.datum <= addTage(h, 21)).sort((a, b) => a.datum.localeCompare(b.datum));
  const frei = freiBezeichnung(h, freieTage);
  const backupAlt = schuelerAnzahl > 0 && (!backup || tageZwischen(backup.slice(0, 10), h) > 30);

  async function gehalten(e: Einheit) {
    await db.einheiten.update(e.id, { status: 'gehalten' });
    await planNeuVerteilen(e.klasseId, e.schuljahrId);
  }

  return (
    <Page title="Heute">
      <div className="muted" style={{ marginBottom: 8 }}>{formatLang(h)}{frei ? ` · ${frei}` : ''}</div>

      {backupAlt ? (
        <Card kind="warn">
          <strong>Backup empfohlen</strong>
          <div className="small">{backup ? `Letztes Backup vom ${backup.slice(0, 10).split('-').reverse().join('.')}.` : 'Noch kein Backup gespeichert.'} Daten liegen nur auf diesem Gerät.</div>
          <div className="btn-row"><Button small onClick={() => nav('/mehr')}>Jetzt sichern</Button></div>
        </Card>
      ) : null}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Aufgaben und Termine</strong>
          <span style={{ display: 'flex', gap: 6 }}>
            <Link className="btn small secondary" to={`/tag/${h}`} style={{ textDecoration: 'none' }}>Tagesplan</Link>
            <Link className="btn small secondary" to="/aufgaben" style={{ textDecoration: 'none' }}>Aufgaben</Link>
          </span>
        </div>
        {verpfHeute.map((v) => <div key={v.id} className="small">🕒 {(() => { const t = aufgabeZeit(v); return t ? spanne(t.von, t.bis) + ' · ' : ''; })()}{v.titel}{v.ort ? ` (${v.ort})` : ''}</div>)}
        {aufHeute.map((a) => <div key={a.id} className="small">☐ {a.titel}{a.faellig && a.faellig < h ? ' (überfällig)' : ''}</div>)}
        {aufMorgen.length ? <div className="muted small">Morgen fällig: {aufMorgen.map((a) => a.titel).join(', ')}</div> : null}
        {!verpfHeute.length && !aufHeute.length && !aufMorgen.length ? <div className="muted small">Heute nichts Offenes.</div> : null}
      </Card>

      {offen.length ? (
        <Section title="Noten noch offen">
          {offen.map((o) => (
            <Card key={o.einheit.id + o.test.id}>
              <Link to={`/test/${o.test.id}?klasse=${o.einheit.klasseId}&datum=${o.einheit.datum}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{o.test.name}</strong> · Klasse {klasseName(o.einheit.klasseId)} · {o.einheit.datum.split('-').reverse().slice(0, 2).join('.')}.
                <div className="small">{o.fehlend.map((s) => vollerName(s)).join(', ')}</div>
              </Link>
              <div className="btn-row">
                <Link className="btn small secondary" to={`/einheit/${o.einheit.id}`} style={{ textDecoration: 'none' }}>In der Einheit abschließen</Link>
              </div>
            </Card>
          ))}
        </Section>
      ) : null}

      {aktiv.length === 0 ? (
        <Empty>
          Willkommen! Lege zuerst deine Klassen an.
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <Button onClick={() => nav('/klassen')}>Klassen anlegen</Button>
          </div>
        </Empty>
      ) : null}

      {heutige.length ? (
        <Section title="Heute im Unterricht">
          <List>
            {heutige.map((e) => {
              const k = klassen.find((x) => x.id === e.klasseId);
              return (
                <div key={e.id} className="row">
                  <Link to={`/einheit/${e.id}`} className="main" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <div className="title">{(() => { const t = einheitZeit(e, k); return t ? `${t.von}–${t.bis} · ` : ''; })()}Klasse {k?.name} {e.status !== 'geplant' ? <Chip kind={e.status === 'ausfall' ? 'red' : 'gray'}>{e.status}</Chip> : null}</div>
                    <div className="sub">{e.titel || lbName(e) || 'noch nicht verplant'}</div>
                  </Link>
                  {e.status === 'geplant' ? <Button small onClick={() => gehalten(e)}>✓ Gehalten</Button> : null}
                </div>
              );
            })}
          </List>
        </Section>
      ) : null}

      {aktiv.map(({ klasse }) => {
        const eigene = einheiten.filter((e) => e.klasseId === klasse.id);
        const letzte = eigene.filter((e) => e.status === 'gehalten').sort((a, b) => b.datum.localeCompare(a.datum))[0];
        const naechste = eigene.filter((e) => e.status === 'geplant' && e.datum >= h).sort((a, b) => a.datum.localeCompare(b.datum))[0];
        return (
          <div key={klasse.id}>
            <Section title={`Klasse ${klasse.name}`} aktion={<Link to={`/plan/${klasse.id}`} style={{ color: 'var(--primary)', textTransform: 'none' }}>Jahresplan ›</Link>} />
            <List>
              <Row
                title="Zuletzt"
                sub={letzte ? `${formatLang(letzte.datum)} · ${letzte.titel || lbName(letzte) || 'ohne Titel'}` : 'noch keine Stunde gehalten'}
                to={letzte ? `/einheit/${letzte.id}` : undefined}
              />
              <Row
                title="Als Nächstes"
                sub={naechste ? `${formatLang(naechste.datum)} · ${naechste.titel || lbName(naechste) || 'noch nicht verplant'}` : 'kein Termin geplant (Jahresplan: Termine anlegen)'}
                to={naechste ? `/einheit/${naechste.id}` : `/plan/${klasse.id}`}
              />
            </List>
            <GeburtstageKarte klasseId={klasse.id} klassenName={klasse.name} />
          </div>
        );
      })}

      {kommendeWk.length ? (
        <Section title="Wettkämpfe in den nächsten 3 Wochen">
          <List>
            {kommendeWk.map((w) => (
              <Row key={w.id} title={`🏆 ${w.name}`} sub={`${formatLang(w.datum)}${w.ort ? ' · ' + w.ort : ''} · ${w.teilnahme === 'lehrkraft' ? 'nur Lehrkraft' : `${w.schuelerIds.length} Kinder`}`} to={`/wettkampf/${w.id}`} />
            ))}
          </List>
        </Section>
      ) : null}
    </Page>
  );
}
