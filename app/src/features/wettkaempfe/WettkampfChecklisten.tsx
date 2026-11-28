import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Card, Check, Section } from '../../components/ui';
import { addTage, formatLang, heute } from '../../lib/dates';
import { kindName, offeneWettkampfPunkte } from '../../lib/wettkampf';

/** Offene Wettkampf-Vorbereitungen der nächsten 31 Tage (Heute und Aufgaben). */
export function WettkampfChecklisten() {
  const h = heute();
  const liste = useLiveQuery(() => db.wettkaempfe.toArray(), [], []) ?? [];
  const kinder = useLiveQuery(() => db.schueler.toArray(), [], []) ?? [];
  const offen = offeneWettkampfPunkte(liste, h, addTage(h, 31));
  if (!offen.length) return null;

  async function umschalten(wid: string, index: number, v: boolean) {
    const w = await db.wettkaempfe.get(wid);
    if (!w) return;
    await db.wettkaempfe.update(wid, { checkliste: w.checkliste.map((p, i) => (i === index ? { ...p, erledigt: v } : p)) });
  }

  return (
    <Section title="Wettkampf-Vorbereitung (nächster Monat)">
      {offen.map(({ w }) => {
        const punkte = w.checkliste.map((p, i) => ({ p, i }));
        const allgemein = punkte.filter((x) => !x.p.schuelerId && !x.p.erledigt);
        const einv = punkte.filter((x) => x.p.schuelerId);
        const einvOffen = einv.filter((x) => !x.p.erledigt);
        return (
          <Card key={w.id}>
            <Link to={`/wettkampf/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <strong>🏆 {w.name}</strong> · {formatLang(w.datum)}{w.beginn ? `, ${w.beginn}${w.ende ? '–' + w.ende : ''} Uhr` : ''}
            </Link>
            {allgemein.map(({ p, i }) => <Check key={i} label={p.text} checked={false} onChange={(v) => umschalten(w.id, i, v)} />)}
            {einv.length ? (
              <details>
                <summary className="small">Einverständnis: {einv.length - einvOffen.length}/{einv.length} · fehlt: {einvOffen.length ? einvOffen.map((x) => kindName(kinder.find((s) => s.id === x.p.schuelerId))).join(', ') : '–'}</summary>
                {einvOffen.map(({ p, i }) => <Check key={i} label={kindName(kinder.find((s) => s.id === p.schuelerId))} checked={false} onChange={(v) => umschalten(w.id, i, v)} />)}
              </details>
            ) : null}
          </Card>
        );
      })}
    </Section>
  );
}
