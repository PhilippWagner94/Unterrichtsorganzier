import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Button, Empty, Page, SelectField, TextArea, TextField, bestaetige } from '../../components/ui';
import { useAutosave } from '../../lib/useAutosave';

export default function EntwurfPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { daten: d, set, flush } = useAutosave(db.entwuerfe, id);
  const lernbereiche = useLiveQuery(() => db.lernbereiche.toArray().then((l) => l.sort((a, b) => a.sortierung - b.sortierung)), [], []) ?? [];
  if (d === undefined) return <Page title="Entwurf" zurueck><Empty>Lädt …</Empty></Page>;
  if (d === null) return <Page title="Entwurf" zurueck><Empty>Nicht gefunden.</Empty></Page>;
  return (
    <Page title={d.titel || 'Stundenentwurf'} zurueck>
      <TextField label="Titel" value={d.titel} onChange={(v) => set({ titel: v })} />
      <SelectField label="Klassenstufe" value={String(d.klassenstufe ?? '')} onChange={(v) => set({ klassenstufe: v ? Number(v) : undefined })} options={[{ value: '', label: 'egal' }, ...[1, 2, 3, 4].map((n) => ({ value: String(n), label: `Klasse ${n}` }))]} />
      <SelectField label="Lernbereich" value={d.lernbereichId ?? ''} onChange={(v) => set({ lernbereichId: v || undefined })} options={[{ value: '', label: '–' }, ...lernbereiche.map((l) => ({ value: l.id, label: l.name }))]} />
      <TextArea label="Aufwärmen / Einstieg" value={d.aufwaermen} onChange={(v) => set({ aufwaermen: v })} rows={4} />
      <TextArea label="Hauptteil" value={d.hauptteil} onChange={(v) => set({ hauptteil: v })} rows={6} />
      <TextArea label="Ausklang" value={d.ausklang} onChange={(v) => set({ ausklang: v })} rows={3} />
      <TextArea label="Material" value={d.material} onChange={(v) => set({ material: v })} rows={2} />
      <TextArea label="Wetteralternative" value={d.wetterAlternative} onChange={(v) => set({ wetterAlternative: v })} rows={2} />
      <div className="btn-row">
        <Button kind="danger" onClick={async () => { if (bestaetige('Entwurf löschen?')) { await flush(); await db.entwuerfe.delete(d.id); nav(-1); } }}>Löschen</Button>
      </div>
    </Page>
  );
}
