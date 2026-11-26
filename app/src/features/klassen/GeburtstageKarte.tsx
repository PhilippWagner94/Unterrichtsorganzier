import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Card } from '../../components/ui';
import { formatKurz, formatLang, heute } from '../../lib/dates';
import { geburtstageZwischen, kommendeGeburtstage } from '../../lib/geburtstage';
import { vollerName } from '../../lib/schuljahr';

/**
 * Geburtstage einer Klasse: seit der letzten gehaltenen Einheit (Ferien eingeschlossen) und in den nächsten 14 Tagen.
 * Ohne `klasseId` über alle aktiven Schüler.
 */
export function GeburtstageKarte({ klasseId, klassenName }: { klasseId: string; klassenName?: string }) {
  const daten = useLiveQuery(async () => {
    const schueler = await db.schueler.where('klasseId').equals(klasseId).toArray();
    const einheiten = await db.einheiten.where('klasseId').equals(klasseId).toArray();
    const letzte = einheiten
      .filter((e) => e.status === 'gehalten' && e.datum <= heute())
      .sort((a, b) => b.datum.localeCompare(a.datum))[0];
    return { schueler, letzte: letzte?.datum };
  }, [klasseId]);
  if (!daten || daten.schueler.length === 0) return null;
  const h = heute();
  const seit = daten.letzte ? geburtstageZwischen(daten.schueler, daten.letzte, h) : [];
  const bald = kommendeGeburtstage(daten.schueler, h, 14).filter((g) => g.datum >= h);
  if (seit.length === 0 && bald.length === 0) return null;
  return (
    <Card kind="soft">
      <strong>🎂 Geburtstage{klassenName ? ` ${klassenName}` : ''}</strong>
      {seit.length ? (
        <div style={{ marginTop: 6 }}>
          <div className="muted small">Seit der letzten Stunde ({daten.letzte ? formatLang(daten.letzte) : '–'}):</div>
          {seit.map((g) => (
            <div key={g.schueler.id + g.datum}>
              {vollerName(g.schueler)} wurde {g.alter} ({formatKurz(g.datum)})
            </div>
          ))}
        </div>
      ) : null}
      {bald.length ? (
        <div style={{ marginTop: 6 }}>
          <div className="muted small">In den nächsten 14 Tagen:</div>
          {bald.map((g) => (
            <div key={g.schueler.id + g.datum}>
              {vollerName(g.schueler)} wird {g.alter} ({g.datum === h ? 'heute' : formatKurz(g.datum)})
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
