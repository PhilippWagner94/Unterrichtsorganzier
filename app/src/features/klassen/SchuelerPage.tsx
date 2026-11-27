import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAktivesSchuljahr, aktiveKlassen } from '../../db/hooks';
import type { Geschlecht } from '../../db/types';
import { Button, Check, ChipAuswahl, Empty, Page, SelectField, TextArea, TextField, bestaetige, useToast } from '../../components/ui';
import { SchuelerLeistungen } from '../tests/SchuelerLeistungen';
import { vollerName } from '../../lib/schuljahr';

const GESCHLECHT = [
  { value: '' as const, label: '–' },
  { value: 'w' as const, label: 'weiblich' },
  { value: 'm' as const, label: 'männlich' },
  { value: 'd' as const, label: 'divers' },
];

export default function SchuelerPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const sj = useAktivesSchuljahr();
  const s = useLiveQuery(() => db.schueler.get(id), [id]);
  const klassen = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [geb, setGeb] = useState('');
  const [geschl, setGeschl] = useState<'' | Geschlecht>('');
  const [hinweis, setHinweis] = useState('');
  const [befreit, setBefreit] = useState(false);
  const [klasseId, setKlasseId] = useState('');
  const [toast, zeigeToast] = useToast();

  useEffect(() => {
    if (!s) return;
    setVorname(s.vorname);
    setNachname(s.nachname);
    setGeb(s.geburtsdatum);
    setGeschl(s.geschlecht ?? '');
    setHinweis(s.hinweis ?? '');
    setBefreit(s.befreit ?? false);
    setKlasseId(s.klasseId);
  }, [s?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return <Page title="Kind" zurueck><Empty>Kind nicht gefunden.</Empty></Page>;

  const klassenOptionen = [
    ...aktiveKlassen(klassen, sj).map((x) => ({ value: x.klasse.id, label: `Klasse ${x.klasse.name}` })),
    ...klassen
      .filter((k) => k.id === s.klasseId && !aktiveKlassen(klassen, sj).some((x) => x.klasse.id === k.id))
      .map((k) => ({ value: k.id, label: `Klasse ${k.name} (nicht aktiv)` })),
  ];

  async function speichern() {
    if (!vorname.trim() || !nachname.trim() || !geb) return;
    await db.schueler.update(id, {
      vorname: vorname.trim(), nachname: nachname.trim(), geburtsdatum: geb,
      geschlecht: geschl || undefined, hinweis: hinweis.trim() || undefined, befreit: befreit || undefined, klasseId,
    });
    zeigeToast('Gespeichert');
  }

  return (
    <Page title={vollerName(s)} zurueck>
      <TextField label="Vorname" value={vorname} onChange={setVorname} />
      <TextField label="Name" value={nachname} onChange={setNachname} />
      <TextField label="Geburtsdatum" type="date" value={geb} onChange={setGeb} />
      <div className="muted small">Geschlecht (optional)</div>
      <ChipAuswahl optionen={GESCHLECHT} wert={geschl} onChange={setGeschl} />
      <SelectField label="Klasse (z. B. bei Klassenwechsel oder Wiederholung)" value={klasseId} onChange={setKlasseId} options={klassenOptionen} />
      <TextArea label="Hinweise (Förderbedarf, Allergien, Absprachen)" value={hinweis} onChange={setHinweis} />
      <Check label="Dauerhaft nicht bewertbar (z. B. Langzeiterkrankung): nie in offenen Tests anzeigen" checked={befreit} onChange={setBefreit} />
      <div className="btn-row">
        <Button onClick={speichern}>Speichern</Button>
        <Button
          kind="danger"
          onClick={async () => {
            if (!bestaetige(`${vollerName(s)} samt allen Ergebnissen löschen?`)) return;
            await db.testergebnisse.where('schuelerId').equals(id).delete();
            await db.schueler.delete(id);
            nav(-1);
          }}
        >
          Löschen
        </Button>
      </div>
      <SchuelerLeistungen schuelerId={id} />
      {toast}
    </Page>
  );
}
