import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId, setEinstellung } from '../../db/db';
import { Balken, Button, Card, Empty, Page, Section, TextField } from '../../components/ui';
import { formatKurz, heute } from '../../lib/dates';
import { ABWESENHEIT, imZeitraum, nachKategorie, perioden, summe, vorherigerZeitraum, wochenMitEintraegen, zeitraum, type ZeitraumTyp } from '../../lib/arbeitszeit';
import { formatDauer, formatStunden } from '../../lib/zeit';
import { useZeitGruppen, useZeitKategorien } from './zeitDaten';

const TYPEN: { typ: ZeitraumTyp; label: string }[] = [
  { typ: 'dieseWoche', label: 'Diese Woche' },
  { typ: 'letzteWoche', label: 'Letzte Woche' },
  { typ: 'dieserMonat', label: 'Dieser Monat' },
  { typ: 'letzterMonat', label: 'Letzter Monat' },
  { typ: 'halbjahr', label: 'Halbjahr' },
  { typ: 'schuljahr', label: 'Schuljahr' },
  { typ: 'eigen', label: 'Eigener Zeitraum' },
];

export default function StatistikPage() {
  const h = heute();
  const alle = useLiveQuery(() => db.zeiten.toArray(), [], []) ?? [];
  const kategorien = useZeitKategorien();
  const gruppen = useZeitGruppen();
  const [typ, setTyp] = useState<ZeitraumTyp>('dieseWoche');
  const [eigen, setEigen] = useState({ von: h, bis: h });
  const [auswahl, setAuswahl] = useState<Set<string> | null>(null); // null = alle
  const [vergleich, setVergleich] = useState<'woche' | 'monat' | 'schuljahr'>('woche');
  const [gruppenName, setGruppenName] = useState('');

  const gewaehlt = useMemo(() => auswahl ?? new Set(kategorien.filter((k) => !ABWESENHEIT.includes(k.id)).map((k) => k.id)), [auswahl, kategorien]);
  const z = zeitraum(typ, h, eigen);
  const davor = vorherigerZeitraum(z, typ);
  const imZ = imZeitraum(alle, z);
  const gesamtAuswahl = summe(imZ.filter((e) => gewaehlt.has(e.kategorieId)));
  const gesamtDavor = summe(imZeitraum(alle, davor, gewaehlt));
  const proKat = nachKategorie(imZ);
  const wochen = wochenMitEintraegen(imZ.filter((e) => gewaehlt.has(e.kategorieId)));
  const reihe = perioden(alle, vergleich, h, gewaehlt);
  const maxReihe = Math.max(1, ...reihe.map((p) => p.minuten));
  const diff = gesamtAuswahl - gesamtDavor;

  const toggle = (id: string) => {
    const n = new Set(gewaehlt);
    if (n.has(id)) n.delete(id); else n.add(id);
    setAuswahl(n);
  };
  const unbekannt = [...proKat.keys()].filter((k) => !kategorien.some((c) => c.id === k));

  return (
    <Page title="Arbeitszeit-Statistik" zurueck>
      <div className="chips">
        {TYPEN.map((t) => <button key={t.typ} className={`chip-btn ${typ === t.typ ? 'on' : ''}`} onClick={() => setTyp(t.typ)}>{t.label}</button>)}
      </div>
      {typ === 'eigen' ? (
        <div className="grid2">
          <TextField label="Von" type="date" value={eigen.von} onChange={(v) => v && setEigen({ ...eigen, von: v })} />
          <TextField label="Bis" type="date" value={eigen.bis} onChange={(v) => v && setEigen({ ...eigen, bis: v })} />
        </div>
      ) : null}
      <div className="muted small">{z.label}: {formatKurz(z.von)} – {formatKurz(z.bis)}</div>

      <Section title="Was zählt mit?" />
      <div className="chips">
        <button className={`chip-btn ${auswahl === null ? 'on' : ''}`} onClick={() => setAuswahl(null)}>Alle Arbeit</button>
        {gruppen.map((g) => (
          <button key={g.id} className="chip-btn" onClick={() => setAuswahl(new Set(g.kategorieIds))}>{g.name}</button>
        ))}
      </div>
      <div className="chips">
        {kategorien.map((k) => <button key={k.id} className={`chip-btn ${gewaehlt.has(k.id) ? 'on' : ''}`} onClick={() => toggle(k.id)}>{k.name}</button>)}
      </div>
      <details>
        <summary className="muted small">Eigene Zusammenfassung speichern oder löschen</summary>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <TextField label="Name der aktuellen Auswahl" value={gruppenName} onChange={setGruppenName} />
          <Button disabled={!gruppenName.trim()} onClick={async () => {
            await setEinstellung('zeitGruppen', [...gruppen, { id: neueId(), name: gruppenName.trim(), kategorieIds: [...gewaehlt] }]);
            setGruppenName('');
          }}>Speichern</Button>
        </div>
        {gruppen.map((g) => (
          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
            <span className="small">{g.name}</span>
            <Button small kind="secondary" onClick={() => setEinstellung('zeitGruppen', gruppen.filter((x) => x.id !== g.id))}>✕</Button>
          </div>
        ))}
      </details>

      <Card>
        <div style={{ fontSize: 30, fontWeight: 700 }}>{formatDauer(gesamtAuswahl)}</div>
        <div className="small">{formatStunden(gesamtAuswahl)} im Zeitraum</div>
        <div className="small muted">
          Vergleichszeitraum ({formatKurz(davor.von)} – {formatKurz(davor.bis)}): {formatDauer(gesamtDavor)}
          {gesamtDavor > 0 || gesamtAuswahl > 0 ? ` (${diff >= 0 ? '+' : '−'}${formatDauer(Math.abs(diff))})` : ''}
        </div>
        {wochen > 0 ? <div className="small muted">Durchschnitt pro Woche mit Einträgen: {formatDauer(gesamtAuswahl / wochen)} ({wochen} Woche(n))</div> : null}
      </Card>

      {(() => {
        const tageAb = (id: string) => new Set(imZ.filter((e) => e.kategorieId === id).map((e) => e.datum)).size;
        const u = tageAb('zk-urlaub');
        const k = tageAb('zk-krank');
        return u || k ? <Card kind="soft"><div className="small">Abwesenheit im Zeitraum: {u} Tage Urlaub, {k} Tage krank (nicht in der Arbeitszeit enthalten)</div></Card> : null;
      })()}

      <Section title="Aufschlüsselung" />
      {imZ.length === 0 ? <Empty>Im Zeitraum sind keine Einträge erfasst.</Empty> : (
        <div>
          {[...kategorien.map((k) => ({ id: k.id, name: k.name })), ...unbekannt.map((id) => ({ id, name: 'Gelöscht' }))]
            .filter((k) => gewaehlt.has(k.id) || unbekannt.includes(k.id))
            .map((k) => ({ ...k, min: proKat.get(k.id) ?? 0 }))
            .filter((k) => k.min > 0)
            .sort((a, b) => b.min - a.min)
            .map((k) => (
              <div key={k.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{k.name}</span>
                  <span>{formatDauer(k.min)} · {gesamtAuswahl ? Math.round((k.min / gesamtAuswahl) * 100) : 0} %</span>
                </div>
                <Balken wert={k.min} max={gesamtAuswahl} />
              </div>
            ))}
        </div>
      )}

      <Section title="Zusammenfassungen im Zeitraum" />
      <div className="list">
        {gruppen.map((g) => {
          const m = summe(imZ.filter((e) => g.kategorieIds.includes(e.kategorieId)));
          return (
            <div key={g.id} className="row"><div className="main"><div className="title">{g.name}</div></div><div className="right">{formatDauer(m)}</div></div>
          );
        })}
      </div>

      <Section title="Vergleich" />
      <div className="chips">
        {([['woche', 'Letzte 8 Wochen'], ['monat', 'Letzte 6 Monate'], ['schuljahr', 'Schuljahre']] as const).map(([k, l]) => (
          <button key={k} className={`chip-btn ${vergleich === k ? 'on' : ''}`} onClick={() => setVergleich(k)}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150, marginTop: 8 }}>
        {reihe.map((p) => (
          <div key={p.key} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div className="small" style={{ fontSize: 11 }}>{p.minuten ? formatStunden(p.minuten) : ''}</div>
            <div style={{ background: 'var(--primary)', borderRadius: 4, height: `${Math.max(2, (p.minuten / maxReihe) * 100)}px`, minHeight: 2 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {reihe.map((p) => <div key={p.key} className="muted" style={{ flex: 1, textAlign: 'center', fontSize: 10 }}>{p.label}</div>)}
      </div>
      <div className="muted small" style={{ marginTop: 8 }}>Der Vergleich nutzt die oben gewählten Kategorien.</div>
    </Page>
  );
}
