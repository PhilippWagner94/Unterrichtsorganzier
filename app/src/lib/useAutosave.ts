import { useEffect, useRef, useState } from 'react';
import type { Table } from 'dexie';

/**
 * Lädt einen Datensatz einmal in lokalen Zustand und speichert Änderungen verzögert (500 ms).
 * So bleibt das Tippen flüssig und der Cursor springt nicht. Beim Verlassen der Seite wird sofort gespeichert.
 */
export function useAutosave<T extends { id: string }>(tabelle: Table<T, string>, id: string) {
  const [daten, setDaten] = useState<T | null | undefined>(undefined);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<T | null>(null);

  const flush = async () => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
      timer.current = undefined;
      if (latest.current) await tabelle.put(latest.current);
    }
  };

  useEffect(() => {
    let lebt = true;
    tabelle.get(id).then((x) => {
      if (!lebt) return;
      latest.current = x ?? null;
      setDaten(x ?? null);
    });
    return () => {
      lebt = false;
      void flush();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<T>) => {
    const basis = latest.current;
    if (!basis) return;
    const neu = { ...basis, ...patch };
    latest.current = neu;
    setDaten(neu);
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      void tabelle.put(neu);
    }, 500);
  };

  return { daten, set, flush };
}
