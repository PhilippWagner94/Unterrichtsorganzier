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
import { LEERE_TEILE, alsSchritte, bereinige, stundeAusText, titelUndRest, type StundenTeile } from './zeilen';
import { formatKurz } from '../../lib/dates';

function ortAusText(t: string): 'halle' | 'draussen' | undefined {
  const s = t.toLowerCase();
  if (/halle/.test(s)) return 'halle';
  if (/drau(ß|ss)en|platz|hof|wiese|stadion|freien/.test(s)) return 'draussen';
  return undefined;
}

type Ziel = 'spiel' | 'reihe' | 'notiz' | 'foto' | 'kinder' | 'einheit';

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
  const [teile, setTeile] = useState<StundenTeile>(LEERE_TEILE);
  const [einheitKlasse, setEinheitKlasse] = useState('');
  const [einheitId, setEinheitId] = useState('');
  const klasseFuerEinheit = einheitKlasse || klassen[0]?.klasse.id || '';
  const einheitenListe = (useLiveQuery(() => (klasseFuerEinheit ? db.einheiten.where('klasseId').equals(klasseFuerEinheit).toArray() : []), [klasseFuerEinheit], []) ?? [])
    .filter((e) => e.status !== 'ausfall' && e.status !== 'verschoben')
    .sort((a, b) => a.datum.localeCompare(b.datum));
  const naechste = einheitenListe.find((e) => e.datum >= new Date().toISOString().slice(0, 10)) ?? einheitenListe[einheitenListe.length - 1];
  const gewaehlteEinheit = einheitenListe.find((e) => e.id === einheitId) ?? naechste;
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
      setTeile(stundeAusText(bereinige(roh)));
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

  async function einheitUebernehmen() {
    const e = gewaehlteEinheit;
    if (!e) return;
    const neu = (alt: string, add: string) => (add.trim() ? (alt.trim() ? `${alt}\n\n${add.trim()}` : add.trim()) : alt);
    await db.einheiten.update(e.id, {
      titel: e.titel ? e.titel : teile.titel.trim(),
      aufwaermen: neu(e.aufwaermen, teile.aufwaermen),
      hauptteil: neu(e.hauptteil, teile.hauptteil),
      ausklang: neu(e.ausklang, teile.ausklang),
      material: neu(e.material, teile.material),
      ...(ortAusText(teile.ort) ? { ort: ortAusText(teile.ort)! } : {}),
      wetterAlternative: neu(e.wetterAlternative, teile.wetterAlternative),
      notizen: neu(e.notizen, teile.notizen),
      reflexion: neu(e.reflexion, teile.reflexion),
    });
    if (bild) await db.anhaenge.add({ id: neueId(), bezugTyp: 'einheit', bezugId: e.id, name: `Foto ${new Date().toLocaleDateString('de-DE')}.jpg`, mime: 'image/jpeg', blob: bild, erstellt: Date.now() });
    nav(`/einheit/${e.id}`);
  }

  async function speichern() {
    if (!bild) return;
    const jetzt = Date.now();
    const { titel, rest } = titelUndRest(text);
    let bezugTyp: 'spiel' | 'reihe' | 'notiz' | 'foto' = ziel === 'kinder' || ziel === 'einheit' ? 'foto' : ziel;
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
          {ziel === 'einheit' ? (
            <>
              <Card kind="soft"><div className="small">Der Text wurde nach Überschriften wie Aufwärmen, Hauptteil, Ausklang, Material aufgeteilt. Prüfe die Felder. Schon vorhandener Inhalt der Einheit bleibt erhalten, der neue Text wird darunter angefügt. Du kannst mehrere Fotos nacheinander in dieselbe Einheit übernehmen.</div></Card>
              <SelectField label="Klasse" value={klasseFuerEinheit} onChange={(v) => { setEinheitKlasse(v); setEinheitId(''); }} options={klassen.map((k) => ({ value: k.klasse.id, label: `Klasse ${k.klasse.name}` }))} />
              <SelectField
                label="Einheit"
                value={gewaehlteEinheit?.id ?? ''}
                onChange={setEinheitId}
                options={einheitenListe.length ? einheitenListe.map((e) => ({ value: e.id, label: `${formatKurz(e.datum)}${e.titel ? ' · ' + e.titel : ''}${e.status === 'gehalten' ? ' (gehalten)' : ''}` })) : [{ value: '', label: 'Keine Einheiten (zuerst Termine anlegen)' }]}
              />
              {([['titel', 'Titel / Thema'], ['aufwaermen', 'Aufwärmen / Einstieg'], ['hauptteil', 'Hauptteil'], ['ausklang', 'Ausklang'], ['material', 'Material'], ['ort', 'Ort (Halle oder draußen)'], ['wetterAlternative', 'Wetteralternative'], ['notizen', 'Notizen'], ['reflexion', 'Reflexion']] as const).map(([k, l]) => (
                <TextArea key={k} label={l} value={teile[k]} onChange={(v) => setTeile({ ...teile, [k]: v })} rows={k === 'titel' || k === 'ort' ? 1 : 4} />
              ))}
              <Button small kind="secondary" onClick={() => setTeile(stundeAusText(text))}>Neu aus erkanntem Text aufteilen</Button>
            </>
          ) : ziel === 'kinder' ? (
            <>
              <TextArea label="Kinder: eine Zeile pro Kind (Name; Vorname; TT.MM.JJJJ; w/m/d)" value={kinderText} onChange={setKinderText} rows={14} />
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
              { value: 'einheit', label: 'Unterrichtsstunde (ganz oder teilweise) in eine Einheit' },
              { value: 'kinder', label: 'Kinderliste einer Klasse (Foto wird nicht gespeichert)' },
              { value: 'spiel', label: 'Spiel (erste Zeile = Titel)' },
              { value: 'reihe', label: 'Methodische Reihe (Schritte aus Nummern)' },
              { value: 'notiz', label: 'Notiz' },
              { value: 'foto', label: 'Nur Bild ablegen' },
            ]}
          />
          {ziel === 'einheit' ? (
            <Button block onClick={einheitUebernehmen} disabled={!gewaehlteEinheit}>In Einheit übernehmen</Button>
          ) : ziel === 'kinder' ? (
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
