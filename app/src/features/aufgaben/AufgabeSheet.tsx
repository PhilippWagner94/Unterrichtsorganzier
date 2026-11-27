import { useEffect, useState } from 'react';
import { db, neueId } from '../../db/db';
import type { Aufgabe, VerpflichtungsArt } from '../../db/types';
import { Button, ChipAuswahl, Sheet, TextArea, TextField, bestaetige } from '../../components/ui';
import { ART_LABEL, KATEGORIE_LABEL } from '../../lib/aufgaben';

const TAGE = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: ['Mo', 'Di', 'Mi', 'Do', 'Fr'][n - 1] }));
const ARTEN = (Object.keys(ART_LABEL) as VerpflichtungsArt[]).map((k) => ({ value: k, label: ART_LABEL[k] }));
const KATS = (Object.keys(KATEGORIE_LABEL) as NonNullable<Aufgabe['kategorie']>[]).map((k) => ({ value: k, label: KATEGORIE_LABEL[k] }));

export interface AufgabeVorgabe {
  typ: 'aufgabe' | 'verpflichtung';
  faellig?: string;
  einheitId?: string;
  klasseId?: string;
  kategorie?: Aufgabe['kategorie'];
  titel?: string;
}

/** Anlegen oder Bearbeiten einer Aufgabe bzw. Verpflichtung. */
export function AufgabeSheet({ offen, onClose, aufgabe, vorgabe }: { offen: boolean; onClose: () => void; aufgabe?: Aufgabe; vorgabe?: AufgabeVorgabe }) {
  const [a, setA] = useState<Aufgabe>();

  useEffect(() => {
    if (!offen) return;
    if (aufgabe) setA(aufgabe);
    else {
      const v = vorgabe ?? { typ: 'aufgabe' as const };
      setA({
        id: neueId(), typ: v.typ, titel: v.titel ?? '', details: '', faellig: v.faellig, erledigt: false, einheitId: v.einheitId, klasseId: v.klasseId,
        kategorie: v.typ === 'aufgabe' ? v.kategorie ?? 'sonstiges' : undefined,
        art: v.typ === 'verpflichtung' ? 'aufsicht_hof' : undefined,
        wiederholung: v.typ === 'verpflichtung' ? 'woechentlich' : undefined, wochentag: 1, woche: 'ungerade', erstellt: Date.now(),
      });
    }
  }, [offen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!a) return null;
  const set = (p: Partial<Aufgabe>) => setA({ ...a, ...p });
  const verpf = a.typ === 'verpflichtung';
  const wdh = a.wiederholung ?? 'einmalig';

  async function speichern() {
    if (!a) return;
    const titel = a.titel.trim() || (verpf && a.art ? ART_LABEL[a.art] : '');
    if (!titel) return;
    await db.aufgaben.put({ ...a, titel });
    onClose();
  }

  return (
    <Sheet offen={offen} onClose={onClose} titel={aufgabe ? (verpf ? 'Verpflichtung bearbeiten' : 'Aufgabe bearbeiten') : verpf ? 'Neue Verpflichtung' : 'Neue Aufgabe'}>
      {verpf ? (
        <>
          <div className="muted small">Art</div>
          <ChipAuswahl optionen={ARTEN} wert={a.art ?? 'sonstiges'} onChange={(v) => set({ art: v })} />
        </>
      ) : null}
      <TextField label={verpf ? 'Bezeichnung (optional)' : 'Was ist zu tun?'} value={a.titel} onChange={(v) => set({ titel: v })} />
      <TextArea label="Details" value={a.details} onChange={(v) => set({ details: v })} rows={3} />
      {!verpf ? (
        <>
          <TextField label="Fällig bis (optional)" type="date" value={a.faellig ?? ''} onChange={(v) => set({ faellig: v || undefined })} />
          <div className="muted small">Kategorie</div>
          <ChipAuswahl optionen={KATS} wert={a.kategorie ?? 'sonstiges'} onChange={(v) => set({ kategorie: v })} />
        </>
      ) : (
        <>
          <div className="muted small">Wiederholung</div>
          <ChipAuswahl
            optionen={[{ value: 'einmalig' as const, label: 'Einmalig' }, { value: 'woechentlich' as const, label: 'Jede Woche' }, { value: 'zweiwoechentlich' as const, label: 'Alle 2 Wochen' }]}
            wert={wdh}
            onChange={(v) => set({ wiederholung: v })}
          />
          {wdh === 'einmalig' ? (
            <TextField label="Datum" type="date" value={a.faellig ?? ''} onChange={(v) => set({ faellig: v || undefined })} />
          ) : (
            <>
              <div className="muted small">Wochentag</div>
              <ChipAuswahl optionen={TAGE} wert={a.wochentag ?? 1} onChange={(v) => set({ wochentag: v })} />
              {wdh === 'zweiwoechentlich' ? (
                <ChipAuswahl optionen={[{ value: 'ungerade' as const, label: 'Ungerade KW' }, { value: 'gerade' as const, label: 'Gerade KW' }]} wert={a.woche ?? 'ungerade'} onChange={(v) => set({ woche: v })} />
              ) : null}
            </>
          )}
          <div className="grid2">
            <TextField label="Von (Uhrzeit)" type="time" value={a.von ?? ''} onChange={(v) => set({ von: v || undefined, zeit: undefined })} />
            <TextField label="Bis" type="time" value={a.bis ?? ''} onChange={(v) => set({ bis: v || undefined, zeit: undefined })} />
          </div>
          <TextField label="Ort" value={a.ort ?? ''} onChange={(v) => set({ ort: v })} />
        </>
      )}
      <div className="btn-row">
        <Button onClick={speichern}>Speichern</Button>
        <Button kind="secondary" onClick={onClose}>Abbrechen</Button>
        {aufgabe ? (
          <Button kind="danger" onClick={async () => { if (bestaetige('Eintrag löschen?')) { await db.aufgaben.delete(aufgabe.id); onClose(); } }}>Löschen</Button>
        ) : null}
      </div>
    </Sheet>
  );
}
