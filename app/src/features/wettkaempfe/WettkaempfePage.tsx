import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import { Chip, Empty, List, Page, Section } from '../../components/ui';
import { Row } from '../../components/ui';
import { formatLang, heute } from '../../lib/dates';
import type { Wettkampf } from '../../db/types';

export default function WettkaempfePage() {
  const nav = useNavigate();
  const liste = useLiveQuery(() => db.wettkaempfe.orderBy('datum').toArray(), [], [] as Wettkampf[]) ?? [];
  const h = heute();
  const kommend = liste.filter((w) => w.datum >= h);
  const vergangen = liste.filter((w) => w.datum < h).reverse();

  async function neu() {
    const id = neueId();
    await db.wettkaempfe.add({ id, name: 'Neuer Wettkampf', datum: h, ort: '', notizen: '', klassenstufen: [], teilnahme: 'kinder', schuelerIds: [], checkliste: [] });
    nav(`/wettkampf/${id}`);
  }

  const zeile = (w: Wettkampf) => (
    <Row
      key={w.id}
      to={`/wettkampf/${w.id}`}
      title={w.name}
      sub={
        <>
          {formatLang(w.datum)}{w.ort ? ` · ${w.ort}` : ''}
          <div style={{ marginTop: 4 }}>
            {w.klassenstufen.map((k) => <Chip key={k}>Klasse {k}</Chip>)}
            <Chip kind="gray">{w.teilnahme === 'lehrkraft' ? 'Nur Lehrkraft' : `${w.schuelerIds.length} Kinder`}</Chip>
          </div>
        </>
      }
    />
  );

  return (
    <Page title="Wettkämpfe" zurueck aktion={<button onClick={neu}>＋ Termin</button>}>
      {liste.length === 0 ? <Empty>Noch keine Wettkampftermine. Lege einzelne Termine an, z. B. Sportfest, Staffelwettkampf oder Hallenturnier.</Empty> : null}
      {kommend.length ? <Section title="Kommende"><List>{kommend.map(zeile)}</List></Section> : null}
      {vergangen.length ? <Section title="Vergangene"><List>{vergangen.map(zeile)}</List></Section> : null}
    </Page>
  );
}
