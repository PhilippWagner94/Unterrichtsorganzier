import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../db/db';
import { Button, Empty, Page, TextArea, TextField, bestaetige } from '../../components/ui';
import { Anhaenge } from '../../components/Anhaenge';
import { useAutosave } from '../../lib/useAutosave';

export default function NotizPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { daten: n, set, flush } = useAutosave(db.notizen, id);

  if (n === undefined) return <Page title="Notiz" zurueck><Empty>Lädt …</Empty></Page>;
  if (n === null) return <Page title="Notiz" zurueck><Empty>Notiz nicht gefunden.</Empty></Page>;

  return (
    <Page title={n.titel || 'Notiz'} zurueck>
      <TextField label="Titel" value={n.titel} onChange={(v) => set({ titel: v })} />
      <TextArea label="Text" value={n.text} onChange={(v) => set({ text: v })} rows={10} />
      <div className="muted small">Bilder</div>
      <Anhaenge bezugTyp="notiz" bezugId={n.id} />
      <div className="btn-row">
        <Button
          kind="danger"
          onClick={async () => {
            if (!bestaetige('Notiz löschen?')) return;
            await flush();
            await db.anhaenge.where('[bezugTyp+bezugId]').equals(['notiz', n.id]).delete();
            await db.notizen.delete(n.id);
            nav(-1);
          }}
        >
          Notiz löschen
        </Button>
      </div>
    </Page>
  );
}
