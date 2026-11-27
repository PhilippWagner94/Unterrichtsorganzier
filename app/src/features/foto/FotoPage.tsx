import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import { Button, Card, Empty, Page, SelectField, TextArea, useToast } from '../../components/ui';
import { useBlobUrl } from '../../components/Anhaenge';
import { verkleinereBild } from '../../lib/bild';
import { erkenneText } from './ocr';
import { schuelerAusFreitext, parseSchuelerZeilen } from '../../lib/schuelerImport';
import { useKlassenAktiv } from '../../db/hooks';
import { alsSchritte, bereinige, titelUndRest } from './zeilen';

type Ziel = 'spiel' | 'reihe' | 'notiz' | 'foto' | 'kinder';

export default function FotoPage() {
  const nav = useNavigate();
  const [bild, setBild] = useState<Blob>();
  const [text, setText] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [anteil, setAnteil] = useState(0);
  const [status, setStatus] = useState('');
  const [fehler, setFehler] = useState('');
  const [params] = useSearchParams();
  const [ziel, setZiel] = useState<Ziel>(params.get('klasse') ? 'kinder' : 'spiel');
  const [klasseId, setKlasseId] = useState(params.get('klasse') ?? '');
  const [kinderText, setKinderText] = useState('');
  const klassen = useKlassenAktiv();
  const vorhandene = useLiveQuery(() => (klasseId ? db.schueler.where('klasseId').equals(klasseId).count() : 0), [klasseId], 0) ?? 0;
  const kinderVorschau = parseSchuelerZeilen(kinderText);
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
      setKinderText(schuelerAusFreitext(bereinige(roh)));
    } catch (e) {
      setFehler('Die Texterkennung hat nicht funktioniert. Du kannst den Text unten selbst eintippen oder nur das Bild ablegen. (' + (e instanceof Error ? e.message : String(e)) + ')');
    } finally {
      setLaeuft(false);
      setFertig(true);
    }
  }

  async function kinderUebernehmen() {
    const k = klasseId || klassen[0]?.klasse.id;
    if (!k || !kinderVorschau.ok.length) return;
    await db.schueler.bulkAdd(kinderVorschau.ok.map((s) => ({ id: neueId(), klasseId: k, ...s })));
    zeigeToast(`${kinderVorschau.ok.length} Kinder hinzugefügt`);
    nav(`/klasse/${k}`);
  }

  async function speichern() {
    if (!bild) return;
    const jetzt = Date.now();
    const { titel, rest } = titelUndRest(text);
    let bezugTyp: 'spiel' | 'reihe' | 'notiz' | 'foto' = ziel === 'kinder' ? 'foto' : ziel;
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
          {ziel === 'kinder' ? (
            <>
              <TextArea label="Kinder: eine Zeile pro Kind (Vorname; Name; TT.MM.JJJJ; w/m/d)" value={kinderText} onChange={setKinderText} rows={14} />
              <Card kind="soft">
                <strong>{kinderVorschau.ok.length} Kinder erkannt.</strong>
                {kinderVorschau.fehler.map((f) => <div key={f} className="err small">{f}</div>)}
                <div className="muted small">Korrigiere den Text oben, bis keine Fehler mehr da sind. Das Foto wird nicht gespeichert.</div>
              </Card>
              <SelectField
                label={`Zu welcher Klasse? ${vorhandene ? `(hat schon ${vorhandene} Kinder)` : ''}`}
                value={klasseId || klassen[0]?.klasse.id || ''}
                onChange={setKlasseId}
                options={klassen.map((k) => ({ value: k.klasse.id, label: `Klasse ${k.klasse.name}` }))}
              />
            </>
          ) : (
            <TextArea label="Erkannter Text (bitte prüfen und korrigieren)" value={text} onChange={setText} rows={14} />
          )}
          <SelectField
            label="Speichern als"
            value={ziel}
            onChange={setZiel}
            options={[
              { value: 'kinder', label: 'Kinderliste einer Klasse (Foto wird nicht gespeichert)' },
              { value: 'spiel', label: 'Spiel (erste Zeile = Titel)' },
              { value: 'reihe', label: 'Methodische Reihe (Schritte aus Nummern)' },
              { value: 'notiz', label: 'Notiz' },
              { value: 'foto', label: 'Nur Bild ablegen' },
            ]}
          />
          {ziel === 'kinder' ? (
            <Button block onClick={kinderUebernehmen} disabled={!kinderVorschau.ok.length || klassen.length === 0}>Kinder übernehmen</Button>
          ) : (
            <Button block onClick={speichern}>Speichern</Button>
          )}
        </>
      ) : null}
      {toast}
    </Page>
  );
}
