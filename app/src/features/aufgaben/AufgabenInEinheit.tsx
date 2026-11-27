import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Aufgabe, Einheit } from '../../db/types';
import { Button, Section } from '../../components/ui';
import { addTage, heute } from '../../lib/dates';
import { AufgabeSheet } from './AufgabeSheet';
import { AufgabeZeile } from './AufgabenPage';

/** Vorbereitungs-Aufgaben für genau diese Einheit. */
export function AufgabenInEinheit({ e }: { e: Einheit }) {
  const liste = useLiveQuery(() => db.aufgaben.where('einheitId').equals(e.id).toArray(), [e.id], []) ?? [];
  const [sheet, setSheet] = useState<{ aufgabe?: Aufgabe } | null>(null);
  const tag = addTage(e.datum, -1);
  return (
    <>
      <Section title="Vorbereitung für diese Stunde" aktion={<Button small onClick={() => setSheet({})}>＋ Aufgabe</Button>} />
      {liste.length === 0 ? <div className="muted small" style={{ marginBottom: 8 }}>Keine Aufgaben, z. B. Material, Kopien, Geräte aufbauen.</div> : (
        <div className="list">{liste.map((a) => <AufgabeZeile key={a.id} a={a} klassen={new Map()} onEdit={() => setSheet({ aufgabe: a })} />)}</div>
      )}
      <AufgabeSheet
        offen={sheet !== null}
        onClose={() => setSheet(null)}
        aufgabe={sheet?.aufgabe}
        vorgabe={{ typ: 'aufgabe', einheitId: e.id, klasseId: e.klasseId, kategorie: 'vorbereitung', faellig: tag < heute() ? e.datum : tag }}
      />
    </>
  );
}
