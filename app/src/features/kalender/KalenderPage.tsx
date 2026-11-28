import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { aktiveKlassen, useAktivesSchuljahr, useSchuljahre, waehleSchuljahr } from '../../db/hooks';
import { Button, Empty, List, Page, Row, Sheet } from '../../components/ui';
import { addTage, isoWoche, formatLang, fromYmd, heute, monatName, toYmd, wochentag } from '../../lib/dates';
import { feiertageImZeitraum } from '../../lib/feiertage';
import { freiBezeichnung, leereEinheit } from '../../lib/plan';
import type { Einheit } from '../../db/types';

const KOPF = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function KalenderPage() {
  const nav = useNavigate();
  const h = heute();
  const [monat, setMonat] = useState(() => ({ j: fromYmd(h).getFullYear(), m: fromYmd(h).getMonth() }));
  const [tag, setTag] = useState<string | null>(null);
  const [monatWahl, setMonatWahl] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const sj = useAktivesSchuljahr();
  const schuljahre = useSchuljahre();
  const einheiten = useLiveQuery(() => db.einheiten.toArray(), [], []) ?? [];
  const klassen = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const lernbereiche = useLiveQuery(() => db.lernbereiche.toArray(), [], []) ?? [];
  const wettkaempfe = useLiveQuery(() => db.wettkaempfe.toArray(), [], []) ?? [];
  const freieTage = useLiveQuery(() => db.freieTage.toArray(), [], []) ?? [];

  const klasseName = (id: string) => klassen.find((k) => k.id === id)?.name ?? '?';
  const lbKuerzel = (e: Einheit) => (e.istPuffer ? 'Puffer' : lernbereiche.find((l) => l.id === e.lernbereichId)?.kuerzel ?? '');

  const zellen = useMemo(() => {
    const erster = toYmd(new Date(monat.j, monat.m, 1, 12));
    const start = addTage(erster, -(wochentag(erster) - 1));
    return Array.from({ length: 42 }, (_, i) => addTage(start, i));
  }, [monat]);

  const feiertage = useMemo(() => feiertageImZeitraum(zellen[0], zellen[41]), [zellen]);
  const proTag = useMemo(() => {
    const m = new Map<string, Einheit[]>();
    for (const e of einheiten) m.set(e.datum, [...(m.get(e.datum) ?? []), e]);
    return m;
  }, [einheiten]);

  function verschiebeMonat(d: number) {
    const x = new Date(monat.j, monat.m + d, 1);
    setMonat({ j: x.getFullYear(), m: x.getMonth() });
  }

  function wischStart(e: React.TouchEvent) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function wischEnde(e: React.TouchEvent) {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) verschiebeMonat(dx < 0 ? 1 : -1);
  }

  const tagEinheiten = tag ? proTag.get(tag) ?? [] : [];
  const tagWk = tag ? wettkaempfe.filter((w) => w.datum === tag) : [];
  const tagFrei = tag ? freiBezeichnung(tag, freieTage) : undefined;
  const aktive = aktiveKlassen(klassen, sj);

  async function einheitAnlegen(klasseId: string) {
    if (!tag) return;
    const s = waehleSchuljahr(schuljahre, tag) ?? sj;
    if (!s) return;
    const e = leereEinheit(klasseId, s.id, tag);
    await db.einheiten.add(e);
    setTag(null);
    nav(`/einheit/${e.id}`);
  }

  return (
    <Page
      title={<button style={{ font: 'inherit', background: 'none', border: 'none', color: 'inherit', padding: 0 }} onClick={() => setMonatWahl(true)} aria-label="Monat auswählen">{monatName(monat.m)} {monat.j} ▾</button>}
      aktion={
        <span style={{ display: 'flex' }}>
          <button onClick={() => verschiebeMonat(-1)} aria-label="Vorheriger Monat">‹</button>
          <button onClick={() => setMonat({ j: fromYmd(h).getFullYear(), m: fromYmd(h).getMonth() })}>Heute</button>
          <button onClick={() => verschiebeMonat(1)} aria-label="Nächster Monat">›</button>
        </span>
      }
    >
      <div className="cal-grid" onTouchStart={wischStart} onTouchEnd={wischEnde}>
        {KOPF.map((k) => <div key={k} className="cal-head">{k}</div>)}
        {zellen.map((d) => {
          const dd = fromYmd(d);
          const imMonat = dd.getMonth() === monat.m;
          const frei = freiBezeichnung(d, freieTage);
          const liste = proTag.get(d) ?? [];
          const wk = wettkaempfe.filter((w) => w.datum === d);
          const feier = feiertage.find((f) => f.datum === d);
          return (
            <button key={d} className={`cal-day ${imMonat ? '' : 'out'} ${d === h ? 'today' : ''} ${frei || feier ? 'frei' : ''}`} onClick={() => setTag(d)}>
              <span className="nr">{dd.getDate()}</span>
              {liste.slice(0, 2).map((e) => (
                <span key={e.id} className={`cal-tag ${e.status === 'gehalten' ? 'gehalten' : e.status === 'ausfall' ? 'ausfall' : ''}`}>
                  {klasseName(e.klasseId)} {lbKuerzel(e)}
                </span>
              ))}
              {liste.length > 2 ? <span className="cal-tag">+{liste.length - 2}</span> : null}
              {wk.slice(0, 1).map((w) => <span key={w.id} className="cal-tag wk">🏆 {w.name}</span>)}
            </button>
          );
        })}
      </div>
      <div className="muted small" style={{ marginTop: 8 }}>
        Grau = Ferien/frei, grün = gehalten, rot = Ausfall, 🏆 = Wettkampf. Tippe auf einen Tag für Details.
      </div>

      <Sheet offen={monatWahl} onClose={() => setMonatWahl(false)} titel="Monat auswählen">
        <div className="btn-row">
          <Button small kind="secondary" onClick={() => setMonat({ ...monat, j: monat.j - 1 })}>‹</Button>
          <span style={{ alignSelf: 'center', minWidth: 60, textAlign: 'center', fontSize: 18 }}>{monat.j}</span>
          <Button small kind="secondary" onClick={() => setMonat({ ...monat, j: monat.j + 1 })}>›</Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {Array.from({ length: 12 }, (_, m) => (
            <Button key={m} kind={m === monat.m ? undefined : 'secondary'} onClick={() => { setMonat({ j: monat.j, m }); setMonatWahl(false); }}>
              {monatName(m).slice(0, 3)}
            </Button>
          ))}
        </div>
      </Sheet>

      <Sheet offen={tag !== null} onClose={() => setTag(null)} titel={tag ? `${formatLang(tag)} · KW ${isoWoche(tag)}` : ''}>
        {tagFrei ? <div className="chip gray">{tagFrei}</div> : null}
        {tagWk.length ? (
          <List>
            {tagWk.map((w) => <Row key={w.id} title={`🏆 ${w.name}`} sub={w.ort} to={`/wettkampf/${w.id}`} />)}
          </List>
        ) : null}
        {tagEinheiten.length ? (
          <List>
            {tagEinheiten.map((e) => (
              <Row
                key={e.id}
                to={`/einheit/${e.id}`}
                title={`Klasse ${klasseName(e.klasseId)}${e.titel ? ' · ' + e.titel : ''}`}
                sub={`${e.zusatz ? 'Zusatzstunde · ' : ''}${e.status === 'geplant' ? 'geplant' : e.status}${lbKuerzel(e) ? ' · ' + lbKuerzel(e) : ''}${e.ausfallGrund ? ' · ' + e.ausfallGrund : ''}`}
              />
            ))}
          </List>
        ) : (
          <Empty>Keine Einheit an diesem Tag.</Empty>
        )}
        {aktive.length ? (
          <>
            <div className="muted small">Einheit hinzufügen für:</div>
            <div className="btn-row">
              {aktive.map((a) => (
                <Button key={a.klasse.id} small kind="secondary" onClick={() => einheitAnlegen(a.klasse.id)}>
                  ＋ {a.klasse.name}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <Link to="/klassen">Zuerst eine Klasse anlegen</Link>
        )}
        <div className="btn-row">
          {tag ? <Link className="btn small" to={`/tag/${tag}`} style={{ textDecoration: 'none' }}>🕒 Tagesplan mit Uhrzeiten</Link> : null}
          <Link className="btn secondary small" to="/wettkaempfe" style={{ textDecoration: 'none' }}>Wettkampftermine</Link>
          <Button kind="secondary" onClick={() => setTag(null)}>Schließen</Button>
        </div>
      </Sheet>
    </Page>
  );
}
