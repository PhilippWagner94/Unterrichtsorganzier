import { Link } from 'react-router-dom';
import { db } from '../../db/db';
import type { Aufgabe } from '../../db/types';
import { heute } from '../../lib/dates';
import { KATEGORIE_LABEL } from '../../lib/aufgaben';
import { aufgabeZeit, spanne } from '../../lib/zeit';

const aufgabeZeitText = (a: Aufgabe) => { const t = aufgabeZeit(a); return t ? spanne(t.von, t.bis) : undefined; };

export function AufgabeZeile({ a, onEdit, klassen }: { a: Aufgabe; onEdit: () => void; klassen: Map<string, string> }) {
  const verpf = a.typ === 'verpflichtung';
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      {!verpf ? (
        <input
          type="checkbox"
          checked={a.erledigt}
          style={{ width: 24, height: 24, marginRight: 10 }}
          aria-label="Erledigt"
          onChange={(e) => db.aufgaben.update(a.id, { erledigt: e.target.checked, erledigtAm: e.target.checked ? heute() : undefined })}
        />
      ) : (
        <span style={{ marginRight: 10 }}>🕒</span>
      )}
      <button className="main" onClick={onEdit} style={{ textAlign: 'left', background: 'none', border: 0, padding: 0, color: 'inherit', font: 'inherit' }}>
        <div className="title" style={a.erledigt ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>{a.titel}</div>
        <div className="sub">
          {[verpf && aufgabeZeitText(a), verpf && a.ort, a.klasseId && klassen.get(a.klasseId) && `Klasse ${klassen.get(a.klasseId)}`, !verpf && a.kategorie && KATEGORIE_LABEL[a.kategorie], a.details].filter(Boolean).join(' · ')}
        </div>
      </button>
      {a.einheitId ? <Link to={`/einheit/${a.einheitId}`} style={{ textDecoration: 'none' }}>📅</Link> : null}
    </div>
  );
}
