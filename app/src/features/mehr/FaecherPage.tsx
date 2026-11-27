import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getEinstellung, neueId, setEinstellung } from '../../db/db';
import { useAktivesSchuljahr } from '../../db/hooks';
import { FACH_SPORT_ID } from '../../data/lehrplanSport';
import { Button, Card, Check, Empty, Page, Section, TextField, bestaetige } from '../../components/ui';

/** Einstellung: Welche Fächer unterrichte ich in diesem Schuljahr? (Vorbereitung: bisher ist nur Sport mit Lehrplan hinterlegt.) */
export const faecherKey = (schuljahrId: string) => `faecher-aktiv:${schuljahrId}`;

export async function aktiveFaecherIds(schuljahrId: string): Promise<string[]> {
  return getEinstellung<string[]>(faecherKey(schuljahrId), [FACH_SPORT_ID]);
}

export default function FaecherPage() {
  const sj = useAktivesSchuljahr();
  const faecher = useLiveQuery(() => db.faecher.toArray(), [], []) ?? [];
  const aktiv = useLiveQuery(() => (sj ? aktiveFaecherIds(sj.id) : [FACH_SPORT_ID]), [sj?.id], [FACH_SPORT_ID]) ?? [FACH_SPORT_ID];
  const [name, setName] = useState('');

  async function umschalten(id: string, an: boolean) {
    if (!sj) return;
    await setEinstellung(faecherKey(sj.id), an ? [...aktiv, id] : aktiv.filter((x) => x !== id));
  }
  async function anlegen() {
    const n = name.trim();
    if (!n) return;
    const id = neueId();
    await db.faecher.add({ id, name: n, kuerzel: n.slice(0, 2), eigene: true });
    setName('');
    await umschalten(id, true);
  }

  return (
    <Page title="Fächer" zurueck>
      <Card kind="soft">
        <div className="small">
          Wähle die Fächer, die du in diesem Schuljahr ({sj?.name ?? '–'}) unterrichtest. Im Moment ist nur für <strong>Sport</strong> ein Lehrplan mit Jahresplanung hinterlegt.
          Weitere Fächer kannst du schon anlegen; Planung und Lehrplan pro Fach folgen später.
        </div>
      </Card>
      <Section title="Fächer in diesem Schuljahr" />
      {faecher.length === 0 ? <Empty>Keine Fächer.</Empty> : null}
      {[...faecher].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((f) => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Check label={`${f.name}${f.eigene ? '' : ' (mit Lehrplan)'}`} checked={aktiv.includes(f.id)} onChange={(v) => umschalten(f.id, v)} />
          </div>
          {f.eigene ? (
            <Button small kind="secondary" onClick={async () => { if (bestaetige(`Fach „${f.name}“ entfernen?`)) { await db.faecher.delete(f.id); } }}>✕</Button>
          ) : null}
        </div>
      ))}
      <Section title="Eigenes Fach hinzufügen" />
      <div style={{ display: 'flex', gap: 8 }}>
        <TextField label="Name (z. B. Mathematik)" value={name} onChange={setName} />
        <div style={{ alignSelf: 'flex-end' }}><Button onClick={anlegen} disabled={!name.trim()}>＋</Button></div>
      </div>
    </Page>
  );
}
