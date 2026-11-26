import { useEffect, useState } from 'react';
import { db, neueId } from '../../db/db';
import type { Klasse } from '../../db/types';
import { Button, Check, ChipAuswahl, Sheet, TextField, bestaetige } from '../../components/ui';
import { wochentagName, heute } from '../../lib/dates';
import { schuljahrStartjahr } from '../../lib/schuljahr';

const TAGE = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: wochentagName(n).slice(0, 2) }));
const STUFEN = [1, 2, 3, 4].map((n) => ({ value: n, label: `Klasse ${n}` }));

/**
 * Formular zum Anlegen und Bearbeiten einer Klasse. Die Klassenstufe wird nicht gespeichert, sondern aus dem
 * Einschulungsjahr berechnet; hier wird sie über „Klassenstufe im Schuljahr“ eingegeben und umgerechnet.
 */
export function KlasseFormular({
  offen,
  onClose,
  klasse,
  startjahr,
  onGespeichert,
}: {
  offen: boolean;
  onClose: () => void;
  klasse?: Klasse;
  startjahr?: number; // Startjahr des aktiven Schuljahres
  onGespeichert?: (k: Klasse) => void;
}) {
  const sj = startjahr ?? schuljahrStartjahr(heute());
  const [name, setName] = useState('');
  const [stufe, setStufe] = useState(1);
  const [wochentag, setWochentag] = useState(1);
  const [zusatz, setZusatz] = useState(false);
  const [zusatzTag, setZusatzTag] = useState(3);

  useEffect(() => {
    if (!offen) return;
    setName(klasse?.name ?? '');
    setStufe(klasse ? Math.min(4, Math.max(1, sj - klasse.einschulungsjahr + 1)) : 1);
    setWochentag(klasse?.wochentag ?? 1);
    setZusatz(klasse?.zusatzAktiv ?? false);
    setZusatzTag(klasse?.zusatzWochentag ?? 3);
  }, [offen, klasse, sj]);

  async function speichern() {
    if (!name.trim()) return;
    const neu: Klasse = {
      id: klasse?.id ?? neueId(),
      name: name.trim(),
      einschulungsjahr: sj - stufe + 1,
      wochentag,
      zusatzAktiv: zusatz,
      zusatzWochentag: zusatzTag,
      archiviert: klasse?.archiviert ?? false,
    };
    await db.klassen.put(neu);
    onGespeichert?.(neu);
    onClose();
  }

  return (
    <Sheet offen={offen} onClose={onClose} titel={klasse ? 'Klasse bearbeiten' : 'Neue Klasse'}>
      <TextField label="Name (z. B. 3a)" value={name} onChange={setName} />
      <div className="muted small">Klassenstufe im aktuellen Schuljahr</div>
      <ChipAuswahl optionen={STUFEN} wert={stufe} onChange={setStufe} />
      <div className="muted small">Wochentag der Doppelstunde</div>
      <ChipAuswahl optionen={TAGE} wert={wochentag} onChange={setWochentag} />
      <Check label="Zusätzliche Doppelstunde alle 2 Wochen" checked={zusatz} onChange={setZusatz} />
      {zusatz ? (
        <>
          <div className="muted small">Wochentag der zusätzlichen Doppelstunde</div>
          <ChipAuswahl optionen={TAGE} wert={zusatzTag} onChange={setZusatzTag} />
        </>
      ) : null}
      <div className="btn-row">
        <Button onClick={speichern} disabled={!name.trim()}>
          Speichern
        </Button>
        <Button kind="secondary" onClick={onClose}>
          Abbrechen
        </Button>
        {klasse ? (
          <Button
            kind="danger"
            onClick={async () => {
              if (!bestaetige(`Klasse ${klasse.name} mit allen Schülern, Einheiten und Plänen endgültig löschen?`)) return;
              await db.transaction('rw', [db.klassen, db.schueler, db.einheiten, db.planBloecke, db.testergebnisse, db.lernzielMarken], async () => {
                const ids = (await db.schueler.where('klasseId').equals(klasse.id).primaryKeys()) as string[];
                await db.testergebnisse.where('schuelerId').anyOf(ids).delete();
                await db.schueler.where('klasseId').equals(klasse.id).delete();
                await db.einheiten.where('klasseId').equals(klasse.id).delete();
                const bl = await db.planBloecke.toArray();
                await db.planBloecke.bulkDelete(bl.filter((b) => b.klasseId === klasse.id).map((b) => b.id));
                const mk = await db.lernzielMarken.toArray();
                await db.lernzielMarken.bulkDelete(mk.filter((m) => m.klasseId === klasse.id).map((m) => m.id));
                await db.klassen.delete(klasse.id);
              });
              onClose();
            }}
          >
            Löschen
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}
