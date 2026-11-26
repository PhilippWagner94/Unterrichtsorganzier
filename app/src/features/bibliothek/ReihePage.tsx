import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Button, Card, Empty, Page, Section, SelectField, TextArea, TextField, bestaetige } from '../../components/ui';
import { Anhaenge } from '../../components/Anhaenge';
import { useAutosave } from '../../lib/useAutosave';

export default function ReihePage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { daten: r, set, flush } = useAutosave(db.reihen, id);
  const lernbereiche = useLiveQuery(() => db.lernbereiche.orderBy('sortierung').toArray(), [], []) ?? [];

  if (r === undefined) return <Page title="Methodische Reihe" zurueck><Empty>Lädt …</Empty></Page>;
  if (r === null) return <Page title="Methodische Reihe" zurueck><Empty>Reihe nicht gefunden.</Empty></Page>;

  const setSchritt = (i: number, patch: Partial<{ titel: string; beschreibung: string }>) =>
    set({ schritte: r.schritte.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const verschiebe = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= r.schritte.length) return;
    const l = [...r.schritte];
    [l[i], l[j]] = [l[j], l[i]];
    set({ schritte: l });
  };

  return (
    <Page title={r.thema || 'Methodische Reihe'} zurueck>
      <TextField label="Thema" value={r.thema} onChange={(v) => set({ thema: v })} />
      <SelectField
        label="Lernbereich"
        value={r.lernbereichId ?? ''}
        onChange={(v) => set({ lernbereichId: v || undefined })}
        options={[{ value: '', label: '– keiner –' }, ...lernbereiche.map((l) => ({ value: l.id, label: l.name }))]}
      />

      <Section title="Lernschritte (in Reihenfolge)" aktion={<Button small onClick={() => set({ schritte: [...r.schritte, { titel: '', beschreibung: '' }] })}>＋ Schritt</Button>} />
      {r.schritte.length === 0 ? <Empty>Noch keine Schritte.</Empty> : null}
      {r.schritte.map((s, i) => (
        <Card key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <strong>{i + 1}.</strong>
            <input type="text" value={s.titel} placeholder="Titel des Schritts" onChange={(e) => setSchritt(i, { titel: e.target.value })} />
          </div>
          <TextArea label="Beschreibung" value={s.beschreibung} onChange={(v) => setSchritt(i, { beschreibung: v })} rows={3} />
          <div className="btn-row">
            <Button small kind="secondary" onClick={() => verschiebe(i, -1)} disabled={i === 0}>▲</Button>
            <Button small kind="secondary" onClick={() => verschiebe(i, 1)} disabled={i === r.schritte.length - 1}>▼</Button>
            <Button small kind="danger" onClick={() => set({ schritte: r.schritte.filter((_, k) => k !== i) })}>Entfernen</Button>
          </div>
        </Card>
      ))}

      <TextArea label="Sicherheits- und Hilfestellungshinweise" value={r.sicherheit} onChange={(v) => set({ sicherheit: v })} rows={4} />
      <TextField label="Quelle" value={r.quelle} onChange={(v) => set({ quelle: v })} />

      <div className="muted small">Bilder und Skizzen</div>
      <Anhaenge bezugTyp="reihe" bezugId={r.id} />

      <div className="btn-row">
        <Button
          kind="danger"
          onClick={async () => {
            if (!bestaetige(`„${r.thema}“ löschen?`)) return;
            await flush();
            await db.anhaenge.where('[bezugTyp+bezugId]').equals(['reihe', r.id]).delete();
            await db.reihen.delete(r.id);
            nav(-1);
          }}
        >
          Reihe löschen
        </Button>
      </div>
    </Page>
  );
}
