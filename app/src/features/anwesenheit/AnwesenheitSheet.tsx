import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { AnwesenheitEintrag, AnwesenheitStatus, Einheit } from '../../db/types';
import { Button, Sheet, TextArea } from '../../components/ui';
import { vollerName } from '../../lib/schuljahr';
import { FEHLVERHALTEN_VORAUSWAHL } from '../../lib/anwesenheit';

const STATI: [AnwesenheitStatus, string][] = [['da', 'da'], ['krank', 'krank geschrieben'], ['fehlt', 'fehlend']];

export function AnwesenheitSheet({ einheit, offen, onClose, speichernAls }: { einheit: Einheit; offen: boolean; onClose: () => void; speichernAls?: (patch: Partial<Einheit>) => void }) {
  const kinder = useLiveQuery(
    () => db.schueler.where('klasseId').equals(einheit.klasseId).toArray().then((l) => l.sort((a, b) => a.nachname.localeCompare(b.nachname, 'de') || a.vorname.localeCompare(b.vorname, 'de'))),
    [einheit.klasseId],
    [],
  ) ?? [];
  const [eintraege, setEintraege] = useState<Record<string, AnwesenheitEintrag>>({});
  const [offenId, setOffenId] = useState<string | null>(null);

  useEffect(() => {
    if (!offen) return;
    const m: Record<string, AnwesenheitEintrag> = {};
    for (const k of kinder) {
      const alt = einheit.anwesenheit?.find((a) => a.schuelerId === k.id);
      m[k.id] = alt ?? { schuelerId: k.id, status: k.befreit ? 'krank' : 'da' };
    }
    setEintraege(m);
    setOffenId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, kinder.length, einheit.id]);

  const aendere = (id: string, patch: Partial<AnwesenheitEintrag>) => setEintraege((m) => ({ ...m, [id]: { ...m[id], ...patch } }));

  async function speichern() {
    const liste = Object.values(eintraege).map((a) => {
      const r: AnwesenheitEintrag = { schuelerId: a.schuelerId, status: a.status };
      if (a.fehlverhalten) { r.fehlverhalten = true; r.gruende = a.gruende ?? []; r.text = a.text ?? ''; }
      return r;
    });
    const patch = { anwesenheit: liste, anwesenheitErfasst: true };
    if (speichernAls) speichernAls(patch);
    else await db.einheiten.update(einheit.id, patch);
    onClose();
  }

  return (
    <Sheet offen={offen} onClose={onClose} titel="Anwesenheit und Verhalten">
      {kinder.length === 0 ? <div className="muted">In dieser Klasse sind noch keine Kinder angelegt.</div> : null}
      {kinder.map((k) => {
        const a = eintraege[k.id];
        if (!a) return null;
        return (
          <div key={k.id} className="card" style={{ padding: 8 }}>
            <div style={{ fontWeight: 600 }}>{vollerName(k)}{a.fehlverhalten ? ' ⚠️' : ''}</div>
            <div className="chips">
              {STATI.map(([v, l]) => (
                <button key={v} className={`chip-btn ${a.status === v ? 'on' : ''}`} onClick={() => aendere(k.id, { status: v })}>{l}</button>
              ))}
              {a.status === 'da' ? (
                <button className={`chip-btn ${a.fehlverhalten ? 'on' : ''}`} onClick={() => { aendere(k.id, { fehlverhalten: !a.fehlverhalten }); setOffenId(!a.fehlverhalten ? k.id : null); }}>
                  Fehlverhalten: {a.fehlverhalten ? 'ja' : 'nein'}
                </button>
              ) : null}
            </div>
            {a.fehlverhalten && a.status === 'da' && offenId === k.id ? (
              <div>
                <div className="chips">
                  {FEHLVERHALTEN_VORAUSWAHL.map((g) => {
                    const an = (a.gruende ?? []).includes(g);
                    return <button key={g} className={`chip-btn ${an ? 'on' : ''}`} onClick={() => aendere(k.id, { gruende: an ? (a.gruende ?? []).filter((x) => x !== g) : [...(a.gruende ?? []), g] })}>{g}</button>;
                  })}
                </div>
                <TextArea label="Genauer (Freitext)" value={a.text ?? ''} onChange={(v) => aendere(k.id, { text: v })} />
              </div>
            ) : a.fehlverhalten && a.status === 'da' ? (
              <div className="small muted" onClick={() => setOffenId(k.id)}>{[...(a.gruende ?? []), a.text].filter(Boolean).join(' · ') || 'Tippen für Details'}</div>
            ) : null}
          </div>
        );
      })}
      <div className="btn-row">
        <Button onClick={speichern}>Speichern</Button>
        <Button kind="secondary" onClick={onClose}>Später</Button>
      </div>
    </Sheet>
  );
}
