import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../db/db';
import type { Anhang } from '../db/types';
import { verkleinereBild } from '../lib/bild';
import { Button, Sheet, bestaetige } from './ui';

/** Object-URL für einen Blob, wird beim Entfernen wieder freigegeben. */
export function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return setUrl(undefined);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

function Vorschau({ a, onClick }: { a: Anhang; onClick: () => void }) {
  const url = useBlobUrl(a.blob);
  return (
    <button
      onClick={onClick}
      style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 0, overflow: 'hidden', width: 88, height: 88, background: 'var(--card)' }}
      aria-label={a.name}
    >
      {url ? <img src={url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
    </button>
  );
}

const istBild = (a: Anhang) => a.mime.startsWith('image/');
const MAX_DOKUMENT_MB = 20;

function Symbol({ name }: { name: string }) {
  const e = name.split('.').pop()?.toLowerCase() ?? '';
  const ico = e === 'pdf' ? '📕' : ['doc', 'docx', 'odt', 'rtf'].includes(e) ? '📘' : ['xls', 'xlsx', 'xlsm', 'ods', 'csv'].includes(e) ? '📗' : ['ppt', 'pptx', 'odp'].includes(e) ? '📙' : '📄';
  return <span style={{ fontSize: 22, marginRight: 10 }}>{ico}</span>;
}

function Gross({ a }: { a: Anhang }) {
  const url = useBlobUrl(a.blob);
  if (!url) return null;
  if (istBild(a)) return <img src={url} alt={a.name} style={{ width: '100%', borderRadius: 10 }} />;
  const speichern = async () => {
    const datei = new File([a.blob], a.name, { type: a.mime || 'application/octet-stream' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [datei] })) {
      try { await nav.share({ files: [datei], title: a.name }); return; } catch (e) { if ((e as DOMException).name === 'AbortError') return; }
    }
    const l = document.createElement('a');
    l.href = url;
    l.download = a.name;
    document.body.appendChild(l);
    l.click();
    l.remove();
  };
  return (
    <div>
      <div className="small" style={{ marginBottom: 8 }}>{Math.max(1, Math.round(a.blob.size / 1024))} KB</div>
      <div className="btn-row">
        <a className="btn" href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Öffnen</a>
        <Button kind="secondary" onClick={speichern}>Teilen / Speichern</Button>
      </div>
    </div>
  );
}

/**
 * Bilder, die einem Eintrag angehängt sind (Spiel, Reihe, Einheit, Notiz, Wettkampf).
 * Aufnahme direkt mit der Kamera oder Auswahl aus der Fotomediathek; Bilder werden verkleinert gespeichert.
 */
export function Anhaenge({ bezugTyp, bezugId }: { bezugTyp: Anhang['bezugTyp']; bezugId: string }) {
  const liste = useLiveQuery(
    () => db.anhaenge.where('[bezugTyp+bezugId]').equals([bezugTyp, bezugId]).toArray(),
    [bezugTyp, bezugId],
    [] as Anhang[],
  );
  const [offen, setOffen] = useState<Anhang | null>(null);
  const [fehler, setFehler] = useState('');
  const dateiRef = useRef<HTMLInputElement>(null);
  const kameraRef = useRef<HTMLInputElement>(null);
  const dokRef = useRef<HTMLInputElement>(null);

  async function hinzufuegen(dateien: FileList | null) {
    if (!dateien?.length) return;
    setFehler('');
    try {
      for (const f of Array.from(dateien)) {
        const bild = f.type.startsWith('image/');
        if (!bild && f.size > MAX_DOKUMENT_MB * 1024 * 1024) throw new Error(`„${f.name}“ ist größer als ${MAX_DOKUMENT_MB} MB.`);
        const blob = bild ? await verkleinereBild(f) : f;
        await db.anhaenge.add({
          id: neueId(),
          bezugTyp,
          bezugId,
          name: f.name || 'Foto.jpg',
          mime: bild ? blob.type : f.type || 'application/octet-stream',
          blob: bild ? blob : new Blob([f], { type: f.type || 'application/octet-stream' }),
          erstellt: Date.now(),
        });
      }
    } catch (e) {
      setFehler((e as Error).message);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {(liste ?? []).filter(istBild).map((a) => (
          <Vorschau key={a.id} a={a} onClick={() => setOffen(a)} />
        ))}
      </div>
      {(liste ?? []).filter((a) => !istBild(a)).map((a) => (
        <button key={a.id} className="row" onClick={() => setOffen(a)} style={{ width: '100%', textAlign: 'left', marginBottom: 6 }}>
          <Symbol name={a.name} />
          <div className="main"><div className="title">{a.name}</div></div>
        </button>
      ))}
      <div className="btn-row">
        <Button small kind="secondary" onClick={() => kameraRef.current?.click()}>
          📷 Foto aufnehmen
        </Button>
        <Button small kind="secondary" onClick={() => dateiRef.current?.click()}>
          🖼 Bild auswählen
        </Button>
        <Button small kind="secondary" onClick={() => dokRef.current?.click()}>
          📎 Dokument (PDF, Word, Excel)
        </Button>
      </div>
      <input ref={dokRef} type="file" accept=".pdf,.doc,.docx,.odt,.rtf,.xls,.xlsx,.xlsm,.ods,.csv,.ppt,.pptx,.odp,.txt,application/pdf" multiple hidden onChange={(e) => { hinzufuegen(e.target.files); e.target.value = ''; }} />
      <input ref={kameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { hinzufuegen(e.target.files); e.target.value = ''; }} />
      <input ref={dateiRef} type="file" accept="image/*" multiple hidden onChange={(e) => { hinzufuegen(e.target.files); e.target.value = ''; }} />
      {fehler ? <div className="err small">{fehler}</div> : null}
      <Sheet offen={!!offen} onClose={() => setOffen(null)} titel={offen?.name ?? ''}>
        {offen ? <Gross a={offen} /> : null}
        <div className="btn-row">
          <Button kind="secondary" onClick={() => setOffen(null)}>Schließen</Button>
          <Button
            kind="danger"
            onClick={async () => {
              if (offen && bestaetige('Wirklich löschen?')) {
                await db.anhaenge.delete(offen.id);
                setOffen(null);
              }
            }}
          >
            Löschen
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
