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

function Gross({ a }: { a: Anhang }) {
  const url = useBlobUrl(a.blob);
  return url ? <img src={url} alt={a.name} style={{ width: '100%', borderRadius: 10 }} /> : null;
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

  async function hinzufuegen(dateien: FileList | null) {
    if (!dateien?.length) return;
    setFehler('');
    try {
      for (const f of Array.from(dateien)) {
        const blob = await verkleinereBild(f);
        await db.anhaenge.add({
          id: neueId(),
          bezugTyp,
          bezugId,
          name: f.name || 'Foto.jpg',
          mime: blob.type,
          blob,
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
        {(liste ?? []).map((a) => (
          <Vorschau key={a.id} a={a} onClick={() => setOffen(a)} />
        ))}
      </div>
      <div className="btn-row">
        <Button small kind="secondary" onClick={() => kameraRef.current?.click()}>
          📷 Foto aufnehmen
        </Button>
        <Button small kind="secondary" onClick={() => dateiRef.current?.click()}>
          🖼 Bild auswählen
        </Button>
      </div>
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
              if (offen && bestaetige('Bild wirklich löschen?')) {
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
