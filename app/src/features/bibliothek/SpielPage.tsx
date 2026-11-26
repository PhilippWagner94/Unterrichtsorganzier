import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../db/db';
import { Button, Chip, ChipAuswahl, Empty, NumberField, Page, TextArea, TextField, bestaetige } from '../../components/ui';
import { Anhaenge } from '../../components/Anhaenge';
import { useAutosave } from '../../lib/useAutosave';
import type { Ort } from '../../db/types';

const ORT: { value: Ort; label: string }[] = [
  { value: 'halle', label: 'Halle' },
  { value: 'draussen', label: 'Draußen' },
  { value: 'beides', label: 'Beides' },
];

export default function SpielPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { daten: s, set, flush } = useAutosave(db.spiele, id);
  const [tagText, setTagText] = useState('');

  if (s === undefined) return <Page title="Spiel" zurueck><Empty>Lädt …</Empty></Page>;
  if (s === null) return <Page title="Spiel" zurueck><Empty>Spiel nicht gefunden.</Empty></Page>;

  function tagHinzu() {
    const t = tagText.trim();
    if (t && s && !s.ziele.includes(t)) set({ ziele: [...s.ziele, t] });
    setTagText('');
  }

  return (
    <Page title={s.titel || 'Spiel'} zurueck aktion={<button onClick={() => set({ favorit: !s.favorit })} aria-label="Favorit">{s.favorit ? '★' : '☆'}</button>}>
      <TextField label="Titel" value={s.titel} onChange={(v) => set({ titel: v })} />
      <TextArea label="Beschreibung / Ablauf" value={s.beschreibung} onChange={(v) => set({ beschreibung: v })} rows={6} />
      <div className="grid2">
        <NumberField label="Dauer (min)" value={s.dauerMin} onChange={(v) => set({ dauerMin: v })} />
        <TextField label="Material" value={s.material} onChange={(v) => set({ material: v })} />
        <NumberField label="Kinder min." value={s.gruppeMin} onChange={(v) => set({ gruppeMin: v })} />
        <NumberField label="Kinder max." value={s.gruppeMax} onChange={(v) => set({ gruppeMax: v })} />
      </div>
      <div className="muted small">Ort</div>
      <ChipAuswahl optionen={ORT} wert={s.ort} onChange={(v) => set({ ort: v })} />

      <div className="muted small">Schlagwörter</div>
      <div className="chips">
        {s.ziele.map((t) => (
          <button key={t} className="chip-btn on" onClick={() => set({ ziele: s.ziele.filter((x) => x !== t) })} aria-label={`${t} entfernen`}>
            {t} ✕
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input type="text" value={tagText} placeholder="z. B. Aufwärmen" onChange={(e) => setTagText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tagHinzu()} />
        <Button onClick={tagHinzu} disabled={!tagText.trim()}>＋</Button>
      </div>

      <TextField label="Quelle (z. B. Buchtitel und Seite)" value={s.quelle} onChange={(v) => set({ quelle: v })} />
      <div className="muted small" style={{ marginTop: -8, marginBottom: 12 }}>
        Tipp: Verweise auf Literatur wie „Kleine Spiele“ als Quelle eintragen, die Beschreibung in eigenen Worten schreiben.
      </div>

      <div className="muted small">Bilder</div>
      <Anhaenge bezugTyp="spiel" bezugId={s.id} />

      <div className="btn-row">
        <Button
          kind="danger"
          onClick={async () => {
            if (!bestaetige(`„${s.titel}“ löschen?`)) return;
            await flush();
            await db.anhaenge.where('[bezugTyp+bezugId]').equals(['spiel', s.id]).delete();
            await db.spiele.delete(s.id);
            nav(-1);
          }}
        >
          Spiel löschen
        </Button>
      </div>
      {s.favorit ? <Chip>Favorit</Chip> : null}
    </Page>
  );
}
