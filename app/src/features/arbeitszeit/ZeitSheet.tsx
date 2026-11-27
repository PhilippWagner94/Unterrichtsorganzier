import { useEffect, useState } from 'react';
import { db, neueId } from '../../db/db';
import type { Zeiteintrag } from '../../db/types';
import { Button, ChipAuswahl, Sheet, TextField, bestaetige } from '../../components/ui';
import { dauerMin, formatDauer } from '../../lib/zeit';
import { useZeitKategorien } from './zeitDaten';

export interface ZeitVorgabe {
  datum: string;
  von?: string;
  bis?: string;
  kategorieId?: string;
}

/** Eintrag der Arbeitszeit anlegen oder bearbeiten. */
export function ZeitSheet({ offen, onClose, eintrag, vorgabe }: { offen: boolean; onClose: () => void; eintrag?: Zeiteintrag; vorgabe: ZeitVorgabe }) {
  const kategorien = useZeitKategorien();
  const [z, setZ] = useState<Zeiteintrag>();

  useEffect(() => {
    if (!offen) return;
    setZ(eintrag ?? { id: neueId(), datum: vorgabe.datum, von: vorgabe.von ?? '14:30', bis: vorgabe.bis ?? '15:30', kategorieId: vorgabe.kategorieId ?? 'zk-vorbereitung', notiz: '', erstellt: Date.now() });
  }, [offen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!z) return null;
  const set = (p: Partial<Zeiteintrag>) => setZ({ ...z, ...p });
  const min = dauerMin(z.von, z.bis);

  return (
    <Sheet offen={offen} onClose={onClose} titel={eintrag ? 'Eintrag bearbeiten' : 'Arbeitszeit eintragen'}>
      <div className="muted small">Was?</div>
      <ChipAuswahl optionen={kategorien.map((k) => ({ value: k.id, label: k.name }))} wert={z.kategorieId} onChange={(v) => set({ kategorieId: v })} />
      <TextField label="Datum" type="date" value={z.datum} onChange={(v) => v && set({ datum: v })} />
      <div className="grid2">
        <TextField label="Von" type="time" value={z.von} onChange={(v) => set({ von: v })} />
        <TextField label="Bis" type="time" value={z.bis} onChange={(v) => set({ bis: v })} />
      </div>
      <div className="muted small">{min > 0 ? `Dauer: ${formatDauer(min)}` : 'Bis muss nach Von liegen.'}</div>
      <TextField label="Notiz (optional)" value={z.notiz} onChange={(v) => set({ notiz: v })} />
      <div className="btn-row">
        <Button disabled={min <= 0} onClick={async () => { await db.zeiten.put(z); onClose(); }}>Speichern</Button>
        <Button kind="secondary" onClick={onClose}>Abbrechen</Button>
        {eintrag ? <Button kind="danger" onClick={async () => { if (bestaetige('Eintrag löschen?')) { await db.zeiten.delete(eintrag.id); onClose(); } }}>Löschen</Button> : null}
      </div>
    </Sheet>
  );
}
