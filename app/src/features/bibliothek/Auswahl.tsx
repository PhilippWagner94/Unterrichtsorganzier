// Auswahl-Fenster für Spiele und methodische Reihen (wird im Einheiten-Editor verwendet).
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Button, Check, Empty, Sheet, TextField } from '../../components/ui';

export interface AuswahlProps {
  offen: boolean;
  onClose: () => void;
  gewaehlt: string[]; // IDs
  onChange: (ids: string[]) => void;
}

interface Eintrag {
  id: string;
  titel: string;
  info: string;
}

function Auswahl({ offen, onClose, gewaehlt, onChange, titel, eintraege, leer }: AuswahlProps & { titel: string; eintraege: Eintrag[]; leer: string }) {
  const [suche, setSuche] = useState('');
  const q = suche.trim().toLowerCase();
  const liste = eintraege.filter((e) => !q || e.titel.toLowerCase().includes(q) || e.info.toLowerCase().includes(q));
  const umschalten = (id: string, an: boolean) => onChange(an ? [...gewaehlt, id] : gewaehlt.filter((x) => x !== id));
  return (
    <Sheet offen={offen} onClose={onClose} titel={titel}>
      <TextField label="Suchen" type="search" value={suche} onChange={setSuche} />
      {liste.length === 0 ? (
        <Empty>{leer}</Empty>
      ) : (
        <div className="list">
          {liste.map((e) => (
            <div key={e.id} className="row">
              <div className="main">
                <Check label={e.titel} checked={gewaehlt.includes(e.id)} onChange={(v) => umschalten(e.id, v)} />
                {e.info ? <div className="sub">{e.info}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="btn-row">
        <Button onClick={onClose}>Fertig ({gewaehlt.length})</Button>
      </div>
    </Sheet>
  );
}

export function SpielAuswahl(props: AuswahlProps) {
  const spiele = useLiveQuery(() => db.spiele.toArray(), [], []) ?? [];
  const eintraege = [...spiele]
    .sort((a, b) => a.titel.localeCompare(b.titel, 'de'))
    .map((s) => ({ id: s.id, titel: s.titel, info: [s.dauerMin ? `${s.dauerMin} min` : '', s.ziele.join(', ')].filter(Boolean).join(' · ') }));
  return <Auswahl {...props} titel="Spiele wählen" eintraege={eintraege} leer="Keine Spiele vorhanden (Bibliothek → Spiele)." />;
}

export function ReiheAuswahl(props: AuswahlProps) {
  const reihen = useLiveQuery(() => db.reihen.toArray(), [], []) ?? [];
  const eintraege = [...reihen]
    .sort((a, b) => a.thema.localeCompare(b.thema, 'de'))
    .map((r) => ({ id: r.id, titel: r.thema, info: `${r.schritte.length} Schritte` }));
  return <Auswahl {...props} titel="Methodische Reihen wählen" eintraege={eintraege} leer="Keine Reihen vorhanden (Bibliothek → Methodik)." />;
}
