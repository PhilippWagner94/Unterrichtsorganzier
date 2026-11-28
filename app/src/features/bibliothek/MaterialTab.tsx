import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import type { MaterialItem } from '../../db/types';
import { Button, Check, Empty, NumberField, Sheet, TextArea, TextField, bestaetige } from '../../components/ui';

export const MATERIAL_KATEGORIEN = ['Bälle', 'Turngeräte', 'Kleingeräte', 'Leichtathletik', 'Wintersport', 'Sonstiges'];

const START: [string, string][] = [
  ['Fußbälle', 'Bälle'], ['Basketbälle', 'Bälle'], ['Volleybälle / Softbälle', 'Bälle'], ['Schaumstoffbälle', 'Bälle'], ['Igelbälle', 'Bälle'],
  ['Weichbodenmatten', 'Turngeräte'], ['Turnmatten', 'Turngeräte'], ['Kästen', 'Turngeräte'], ['Bänke', 'Turngeräte'], ['Reifen', 'Kleingeräte'],
  ['Seile', 'Kleingeräte'], ['Hütchen', 'Kleingeräte'], ['Leibchen', 'Kleingeräte'], ['Tücher', 'Kleingeräte'], ['Staffelstäbe', 'Leichtathletik'],
  ['Maßband', 'Leichtathletik'], ['Stoppuhren', 'Leichtathletik'], ['Schlagbälle (80 g)', 'Leichtathletik'], ['Trillerpfeife', 'Sonstiges'], ['Erste-Hilfe-Set', 'Sonstiges'],
];

/** Reiter „Material“: Inventarliste mit Kategorien, Haken „haben wir“ und Verknüpfung zu einer Aufgabe. */
export function MaterialTab({ neuesOeffnen, setNeuesOeffnen }: { neuesOeffnen: boolean; setNeuesOeffnen: (v: boolean) => void }) {
  const items = useLiveQuery(() => db.materialien.toArray(), [], []) ?? [];
  const aufgaben = useLiveQuery(() => db.aufgaben.toArray(), [], []) ?? [];
  const [nurFehlt, setNurFehlt] = useState(false);
  const [edit, setEdit] = useState<MaterialItem | null>(null);

  const kategorien = [...new Set([...MATERIAL_KATEGORIEN, ...items.map((i) => i.kategorie)])].filter((k) => items.some((i) => i.kategorie === k));
  const sichtbar = items.filter((i) => !nurFehlt || !i.vorhanden);

  async function laden() {
    const vorhanden = new Set(items.map((i) => i.name));
    await db.materialien.bulkAdd(START.filter(([n]) => !vorhanden.has(n)).map(([name, kategorie]) => ({ id: neueId(), name, kategorie, vorhanden: false, notiz: '', erstellt: Date.now() })));
  }

  async function speichern() {
    if (!edit || !edit.name.trim()) return;
    await db.materialien.put({ ...edit, name: edit.name.trim(), kategorie: edit.kategorie.trim() || 'Sonstiges' });
    setEdit(null);
  }

  async function aufgabeAnlegen(art: 'beschaffen' | 'erstellen') {
    if (!edit) return;
    const id = neueId();
    await db.aufgaben.add({
      id, typ: 'aufgabe', titel: `Material ${art}: ${edit.name}`, details: edit.notiz, erledigt: false, kategorie: 'vorbereitung', erstellt: Date.now(),
    });
    const neu = { ...edit, aufgabeId: id };
    await db.materialien.put(neu);
    setEdit(neu);
  }

  const aufgabe = edit?.aufgabeId ? aufgaben.find((a) => a.id === edit.aufgabeId) : undefined;

  return (
    <>
      <div className="chips">
        <button className={`chip-btn ${nurFehlt ? 'on' : ''}`} onClick={() => setNurFehlt(!nurFehlt)}>Nur Fehlendes ({items.filter((i) => !i.vorhanden).length})</button>
      </div>
      {items.length === 0 ? (
        <Empty>
          Noch kein Material erfasst. Hake ab, was ihr an der Schule habt – was fehlt, kannst du mit einer Aufgabe (beschaffen / selbst erstellen) verknüpfen.
          <div className="btn-row" style={{ justifyContent: 'center' }}><Button onClick={laden}>Übliche Sportgeräte vorschlagen</Button></div>
        </Empty>
      ) : null}
      {kategorien.map((k) => {
        const liste = sichtbar.filter((i) => i.kategorie === k).sort((a, b) => a.name.localeCompare(b.name, 'de'));
        if (!liste.length) return null;
        return (
          <div key={k} className="card">
            <strong>{k}</strong> <span className="muted small">{liste.filter((i) => i.vorhanden).length}/{liste.length} vorhanden</span>
            {liste.map((i) => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <Check label={`${i.name}${i.anzahl ? ` (${i.anzahl})` : ''}`} checked={i.vorhanden} onChange={(v) => db.materialien.update(i.id, { vorhanden: v })} />
                </div>
                {i.aufgabeId ? <span title="Aufgabe verknüpft">{aufgaben.find((a) => a.id === i.aufgabeId)?.erledigt ? '✅' : '📌'}</span> : null}
                <Button small kind="secondary" onClick={() => setEdit(i)}>✎</Button>
              </div>
            ))}
          </div>
        );
      })}

      <Sheet offen={neuesOeffnen} onClose={() => setNeuesOeffnen(false)} titel="Material hinzufügen">
        <NeuesMaterial onFertig={() => setNeuesOeffnen(false)} />
      </Sheet>

      <Sheet offen={edit !== null} onClose={() => setEdit(null)} titel="Material bearbeiten">
        {edit ? (
          <>
            <TextField label="Name" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <div className="muted small">Kategorie</div>
            <div className="chips">
              {[...new Set([...MATERIAL_KATEGORIEN, ...items.map((i) => i.kategorie)])].map((k) => (
                <button key={k} className={`chip-btn ${edit.kategorie === k ? 'on' : ''}`} onClick={() => setEdit({ ...edit, kategorie: k })}>{k}</button>
              ))}
            </div>
            <TextField label="Oder neue Kategorie" value={MATERIAL_KATEGORIEN.includes(edit.kategorie) || items.some((i) => i.kategorie === edit.kategorie && i.id !== edit.id) ? '' : edit.kategorie} onChange={(v) => setEdit({ ...edit, kategorie: v })} />
            <NumberField label="Anzahl (optional)" value={edit.anzahl} onChange={(v) => setEdit({ ...edit, anzahl: v })} />
            <Check label="Haben wir" checked={edit.vorhanden} onChange={(v) => setEdit({ ...edit, vorhanden: v })} />
            <TextArea label="Notiz" value={edit.notiz} onChange={(v) => setEdit({ ...edit, notiz: v })} />
            {!edit.vorhanden ? (
              aufgabe ? (
                <div className="card soft">
                  Verknüpfte Aufgabe: <strong>{aufgabe.titel}</strong> {aufgabe.erledigt ? '(erledigt)' : '(offen)'}
                  <div className="btn-row">
                    <Link className="btn small secondary" to="/aufgaben" style={{ textDecoration: 'none' }}>Zu den Aufgaben</Link>
                    {aufgabe.erledigt ? <Button small onClick={() => setEdit({ ...edit, vorhanden: true })}>Jetzt vorhanden</Button> : null}
                  </div>
                </div>
              ) : (
                <div className="btn-row">
                  <Button small kind="secondary" onClick={() => aufgabeAnlegen('beschaffen')}>📌 Aufgabe: beschaffen</Button>
                  <Button small kind="secondary" onClick={() => aufgabeAnlegen('erstellen')}>📌 Aufgabe: selbst erstellen</Button>
                </div>
              )
            ) : null}
            <div className="btn-row">
              <Button onClick={speichern}>Speichern</Button>
              <Button kind="danger" onClick={async () => { if (bestaetige(`„${edit.name}“ löschen?`)) { await db.materialien.delete(edit.id); setEdit(null); } }}>Löschen</Button>
            </div>
          </>
        ) : null}
      </Sheet>
    </>
  );
}

function NeuesMaterial({ onFertig }: { onFertig: () => void }) {
  const [name, setName] = useState('');
  const [kategorie, setKategorie] = useState('Sonstiges');
  return (
    <>
      <TextField label="Name" value={name} onChange={setName} placeholder="z. B. Gymnastikbänder" />
      <div className="chips">
        {MATERIAL_KATEGORIEN.map((k) => <button key={k} className={`chip-btn ${kategorie === k ? 'on' : ''}`} onClick={() => setKategorie(k)}>{k}</button>)}
      </div>
      <div className="btn-row">
        <Button disabled={!name.trim()} onClick={async () => { await db.materialien.add({ id: neueId(), name: name.trim(), kategorie, vorhanden: false, notiz: '', erstellt: Date.now() }); setName(''); onFertig(); }}>Hinzufügen</Button>
        <Button kind="secondary" onClick={onFertig}>Abbrechen</Button>
      </div>
    </>
  );
}
