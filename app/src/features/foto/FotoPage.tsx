import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, neueId } from '../../db/db';
import { Button, Card, Empty, Page, SelectField, TextArea, useToast } from '../../components/ui';
import { useBlobUrl } from '../../components/Anhaenge';
import { verkleinereBild } from '../../lib/bild';
import { erkenneText } from './ocr';
import { alsSchritte, bereinige, titelUndRest } from './zeilen';

type Ziel = 'spiel' | 'reihe' | 'notiz' | 'foto';

export default function FotoPage() {
  const nav = useNavigate();
  const [bild, setBild] = useState<Blob>();
  const [text, setText] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [anteil, setAnteil] = useState(0);
  const [status, setStatus] = useState('');
  const [fehler, setFehler] = useState('');
  const [ziel, setZiel] = useState<Ziel>('spiel');
  const [fertigErkannt, setFertig] = useState(false);
  const url = useBlobUrl(bild);
  const kamera = useRef<HTMLInputElement>(null);
  const datei = useRef<HTMLInputElement>(null);
  const [toast, zeigeToast] = useToast();

  async function gewaehlt(f?: File | null) {
    if (!f) return;
    setFehler('');
    setFertig(false);
    setText('');
    setLaeuft(true);
    try {
      const klein = await verkleinereBild(f, 2000, 0.9);
      setBild(klein);
      const roh = await erkenneText(klein, (p, s) => { setAnteil(p); setStatus(s); });
      setText(bereinige(roh));
    } catch (e) {
      setFehler('Die Texterkennung hat nicht funktioniert. Du kannst den Text unten selbst eintippen oder nur das Bild ablegen. (' + (e instanceof Error ? e.message : String(e)) + ')');
    } finally {
      setLaeuft(false);
      setFertig(true);
    }
  }

  async function speichern() {
    if (!bild) return;
    const jetzt = Date.now();
    const { titel, rest } = titelUndRest(text);
    let bezugTyp: 'spiel' | 'reihe' | 'notiz' | 'foto' = ziel;
    let bezugId: string | null = null;
    if (ziel === 'spiel') {
      bezugId = neueId();
      await db.spiele.add({ id: bezugId, titel: titel || 'Neues Spiel', beschreibung: rest, material: '', ort: 'beides', ziele: [], quelle: 'Foto', favorit: false, erstellt: jetzt });
    } else if (ziel === 'reihe') {
      bezugId = neueId();
      await db.reihen.add({ id: bezugId, thema: titel || 'Neue Reihe', schritte: alsSchritte(rest), sicherheit: '', quelle: 'Foto', erstellt: jetzt });
    } else if (ziel === 'notiz') {
      bezugId = neueId();
      await db.notizen.add({ id: bezugId, titel: titel || 'Notiz', text: rest, erstellt: jetzt });
    }
    await db.anhaenge.add({ id: neueId(), bezugTyp, bezugId, name: `Foto ${new Date(jetzt).toLocaleDateString('de-DE')}.jpg`, mime: 'image/jpeg', blob: bild, erstellt: jetzt });
    zeigeToast('Gespeichert');
    nav(ziel === 'spiel' ? `/spiel/${bezugId}` : ziel === 'reihe' ? `/reihe/${bezugId}` : ziel === 'notiz' ? `/notiz/${bezugId}` : '/bibliothek');
  }

  return (
    <Page title="Foto importieren" zurueck>
      <Card kind="soft">
        Die Texterkennung läuft komplett auf deinem Gerät. Das Foto und der Text werden nicht hochgeladen. Beim ersten Mal werden einmalig die Sprachdaten (ca. 15 MB) geladen, danach geht es auch ohne Internet.
      </Card>
      <input ref={kamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { gewaehlt(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={datei} type="file" accept="image/*" hidden onChange={(e) => { gewaehlt(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="btn-row">
        <Button onClick={() => kamera.current?.click()} disabled={laeuft}>📷 Foto aufnehmen</Button>
        <Button kind="secondary" onClick={() => datei.current?.click()} disabled={laeuft}>Aus Fotos wählen</Button>
      </div>
      {laeuft ? <Card>Erkenne Text … {Math.round(anteil * 100)} % <span className="muted small">({status})</span></Card> : null}
      {fehler ? <Card kind="soft">{fehler}</Card> : null}
      {!bild && !laeuft ? <Empty>Fotografiere eine Seite aus einem Buch oder einen Zettel.</Empty> : null}
      {bild && fertigErkannt ? (
        <>
          {url ? <img src={url} alt="Foto" style={{ width: '100%', borderRadius: 10, marginBottom: 12 }} /> : null}
          <TextArea label="Erkannter Text (bitte prüfen und korrigieren)" value={text} onChange={setText} rows={14} />
          <SelectField
            label="Speichern als"
            value={ziel}
            onChange={setZiel}
            options={[
              { value: 'spiel', label: 'Spiel (erste Zeile = Titel)' },
              { value: 'reihe', label: 'Methodische Reihe (Schritte aus Nummern)' },
              { value: 'notiz', label: 'Notiz' },
              { value: 'foto', label: 'Nur Bild ablegen' },
            ]}
          />
          <Button block onClick={speichern}>Speichern</Button>
        </>
      ) : null}
      {toast}
    </Page>
  );
}
