import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import { stufeIm, useAktivesSchuljahr } from '../../db/hooks';
import type { Einheit, PlanBlock } from '../../db/types';
import { Balken, Button, Card, Chip, Empty, List, Page, Row, Section, SelectField, Sheet, useToast, bestaetige } from '../../components/ui';
import { fehlendeEinheiten, veralteteEinheiten, offenePuffer, verteile, zaehleUstd } from '../../lib/plan';
import { planNeuVerteilen } from '../../lib/planAktionen';
import { formatKurz, formatLang } from '../../lib/dates';
import { grobplanFuer } from '../../data/grobplan';

const STATUS_LABEL: Record<Einheit['status'], string> = {
  geplant: 'geplant',
  gehalten: 'gehalten',
  ausfall: 'Ausfall',
  vertretung: 'Vertretung',
  verschoben: 'verschoben',
};

export default function PlanPage() {
  const { klasseId = '' } = useParams();
  const sj = useAktivesSchuljahr();
  const klasse = useLiveQuery(() => db.klassen.get(klasseId), [klasseId]);
  const lernbereiche = useLiveQuery(() => db.lernbereiche.toArray().then((l) => l.sort((a, b) => a.sortierung - b.sortierung)), [], []) ?? [];
  const sjId = sj?.id ?? '';
  const bloecke = useLiveQuery(
    () => db.planBloecke.where('[klasseId+schuljahrId]').equals([klasseId, sjId]).sortBy('sortierung'),
    [klasseId, sjId],
    [] as PlanBlock[],
  ) ?? [];
  const einheiten = useLiveQuery(
    () => db.einheiten.where('[klasseId+schuljahrId]').equals([klasseId, sjId]).sortBy('datum'),
    [klasseId, sjId],
    [] as Einheit[],
  ) ?? [];
  const [neu, setNeu] = useState(false);
  const [neuLb, setNeuLb] = useState('puffer');
  const [neuAnzahl, setNeuAnzahl] = useState(4);
  const [alleTermine, setAlleTermine] = useState(false);
  const [toast, zeigeToast] = useToast();

  if (!klasse || !sj) {
    return (
      <Page title="Jahresplan" zurueck>
        <Empty>{!sj ? 'Kein Schuljahr vorhanden (Mehr → Schuljahr und Ferien).' : 'Klasse nicht gefunden.'}</Empty>
      </Page>
    );
  }

  const stufe = stufeIm(klasse, sj);
  const lbMap = new Map(lernbereiche.map((l) => [l.id, l]));
  const ustd = zaehleUstd(einheiten);
  const erg = verteile(einheiten, bloecke);
  const gehalten = einheiten.filter((e) => e.status === 'gehalten').length;
  const offen = einheiten.filter((e) => e.status === 'geplant').length;
  const ausgefallen = einheiten.filter((e) => e.status === 'ausfall').length;

  async function termineErzeugen() {
    if (!klasse || !sj) return;
    const freie = await db.freieTage.where('schuljahrId').equals(sj.id).toArray();
    const neue = fehlendeEinheiten(klasse, sj, freie, einheiten);
    if (neue.length) await db.einheiten.bulkAdd(neue);
    await planNeuVerteilen(klasse.id, sj.id);
    zeigeToast(neue.length ? `${neue.length} Termine angelegt` : 'Keine neuen Termine nötig');
  }

  async function termineAbgleichen() {
    if (!klasse || !sj) return;
    const freie = await db.freieTage.where('schuljahrId').equals(sj.id).toArray();
    const alt = veralteteEinheiten(klasse, sj, freie, einheiten);
    if (alt.length) await db.einheiten.bulkDelete(alt.map((e) => e.id));
    const neue = fehlendeEinheiten(klasse, sj, freie, einheiten.filter((e) => !alt.includes(e)));
    if (neue.length) await db.einheiten.bulkAdd(neue);
    await planNeuVerteilen(klasse.id, sj.id);
    zeigeToast(`${neue.length} Termine ergänzt, ${alt.length} veraltete entfernt`);
  }

  async function grobplanAnwenden() {
    if (!klasse || !sj || !stufe) return;
    if (bloecke.length && !bestaetige('Die bestehende Reihenfolge wird durch den Vorschlag ersetzt. Fortfahren?')) return;
    const lbIds = new Set(lernbereiche.map((l) => l.id));
    await db.planBloecke.where('[klasseId+schuljahrId]').equals([klasse.id, sj.id]).delete();
    const vorschlag = grobplanFuer(stufe, einheiten.filter((e) => e.status !== 'ausfall').length || 25)
      .filter((b) => b.lernbereichId === null || lbIds.has(b.lernbereichId));
    await db.planBloecke.bulkAdd(
      vorschlag.map((b, i) => ({ id: neueId(), klasseId: klasse.id, schuljahrId: sj.id, lernbereichId: b.lernbereichId, titel: b.hinweis, anzahl: b.anzahl, sortierung: i + 1 })),
    );
    await planNeuVerteilen(klasse.id, sj.id);
    zeigeToast('Vorschlag übernommen, du kannst alles ändern');
  }

  async function neuVerteilen() {
    if (!klasse || !sj) return;
    await planNeuVerteilen(klasse.id, sj.id);
    zeigeToast('Plan neu verteilt');
  }

  async function blockAnlegen() {
    if (!klasse || !sj) return;
    const sort = bloecke.length ? Math.max(...bloecke.map((b) => b.sortierung)) + 1 : 1;
    await db.planBloecke.add({
      id: neueId(),
      klasseId: klasse.id,
      schuljahrId: sj.id,
      lernbereichId: neuLb === 'puffer' ? null : neuLb,
      anzahl: neuAnzahl,
      sortierung: sort,
    });
    setNeu(false);
    await planNeuVerteilen(klasse.id, sj.id);
  }

  async function anzahlAendern(b: PlanBlock, delta: number) {
    const anzahl = Math.max(0, b.anzahl + delta);
    await db.planBloecke.update(b.id, { anzahl });
    await planNeuVerteilen(b.klasseId, b.schuljahrId);
  }

  async function verschieben(index: number, richtung: -1 | 1) {
    const ziel = index + richtung;
    if (ziel < 0 || ziel >= bloecke.length) return;
    const liste = [...bloecke];
    [liste[index], liste[ziel]] = [liste[ziel], liste[index]];
    await db.planBloecke.bulkPut(liste.map((b, i) => ({ ...b, sortierung: i + 1 })));
    await planNeuVerteilen(klasse!.id, sj!.id);
  }

  async function blockLoeschen(b: PlanBlock) {
    if (!bestaetige('Block aus dem Plan entfernen?')) return;
    await db.planBloecke.delete(b.id);
    await planNeuVerteilen(b.klasseId, b.schuljahrId);
  }

  const aktiveLb = lernbereiche.filter((l) => l.aktiv);
  const optionen = [{ value: 'puffer', label: 'Pufferstunden' }, ...aktiveLb.map((l) => ({ value: l.id, label: l.name }))];
  const sichtbareTermine = alleTermine ? einheiten : einheiten.filter((e) => e.status !== 'gehalten').slice(0, 12);

  return (
    <Page title={`Jahresplan ${klasse.name}`} zurueck={`/klasse/${klasse.id}`}>
      <div className="muted small">
        Schuljahr {sj.name}
        {stufe ? ` · Klassenstufe ${stufe}` : ''}
      </div>

      {einheiten.length === 0 ? (
        <Card kind="soft">
          <strong>Noch keine Termine.</strong>
          <p className="small">
            Die App legt für jede Unterrichtswoche (ohne Ferien und Feiertage) einen Termin am {klasse.zusatzAktiv ? 'Haupt- und Zusatz-' : ''}Wochentag
            der Klasse an. Danach verteilst du die Lernbereiche darauf.
          </p>
          <Button onClick={termineErzeugen}>Termine für {sj.name} anlegen</Button>
        </Card>
      ) : (
        <Card>
          <div>
            <Chip>{einheiten.length - ausgefallen} Termine</Chip>
            <Chip kind="gray">{gehalten} gehalten</Chip>
            <Chip kind="gray">{offen} offen</Chip>
            {ausgefallen ? <Chip kind="red">{ausgefallen} Ausfall</Chip> : null}
            <Chip kind="warn">{offenePuffer(einheiten)} Puffer eingeplant</Chip>
          </div>
          {erg.ueberzaehlig > 0 ? (
            <div className="err small" style={{ marginTop: 6 }}>
              ⚠ {erg.ueberzaehlig} Plan-Einheiten haben keinen freien Termin mehr. Block kürzen, Puffer streichen oder Termine ergänzen.
            </div>
          ) : null}
          {erg.ohneInhalt > 0 ? (
            <div className="muted small" style={{ marginTop: 6 }}>
              {erg.ohneInhalt} offene Termine sind noch nicht verplant.
            </div>
          ) : null}
          <div className="btn-row">
            <Button small kind="secondary" onClick={termineAbgleichen}>Termine abgleichen</Button>
            <Button small kind="secondary" onClick={neuVerteilen}>Plan neu verteilen</Button>
          </div>
        </Card>
      )}

      <Section title="Reihenfolge der Lernbereiche" aktion={<Button small onClick={() => setNeu(true)}>＋ Block</Button>}>
        {einheiten.length > 0 ? (
          <Card kind="soft">
            <div className="small">Grobfahrplan für Klasse {stufe ?? ''}: ein Vorschlag, welcher Lernbereich wann dran ist (Draußen im Herbst und Frühjahr, Turnen und Gymnastik im Winter). Alles bleibt änderbar.</div>
            <Button small onClick={grobplanAnwenden}>Grobfahrplan vorschlagen</Button>
          </Card>
        ) : null}
        {bloecke.length === 0 ? (
          <Empty>Noch keine Blöcke. Lege Lernbereiche in der gewünschten Reihenfolge an, z. B. Leichtathletik 6, Turnen 5, Puffer 2 …</Empty>
        ) : (
          <List>
            {bloecke.map((b, i) => {
              const lb = b.lernbereichId ? lbMap.get(b.lernbereichId) : undefined;
              const zugeordnet = einheiten.filter((e) => e.blockId === b.id);
              const von = zugeordnet[0]?.datum;
              const bis = zugeordnet[zugeordnet.length - 1]?.datum;
              return (
                <div key={b.id} className="row" style={{ alignItems: 'flex-start' }}>
                  <div className="main">
                    <div className="title">
                      {lb ? (
                        <span style={{ color: lb.farbe }}>● </span>
                      ) : (
                        <span>⏸ </span>
                      )}
                      {lb ? lb.name : 'Pufferstunden'}
                    </div>
                    <div className="sub">
                      {von ? `${formatKurz(von)} – ${formatKurz(bis!)}` : 'noch ohne Termin'}{b.titel ? ` · ${b.titel}` : ''}
                    </div>
                    <div className="btn-row">
                      <Button small kind="secondary" onClick={() => anzahlAendern(b, -1)}>−</Button>
                      <span style={{ alignSelf: 'center', minWidth: 70, textAlign: 'center' }}>{b.anzahl} Einheiten</span>
                      <Button small kind="secondary" onClick={() => anzahlAendern(b, 1)}>＋</Button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Button small kind="secondary" onClick={() => verschieben(i, -1)} disabled={i === 0}>▲</Button>
                    <Button small kind="secondary" onClick={() => verschieben(i, 1)} disabled={i === bloecke.length - 1}>▼</Button>
                    <Button small kind="danger" onClick={() => blockLoeschen(b)}>✕</Button>
                  </div>
                </div>
              );
            })}
          </List>
        )}
      </Section>

      <Section title="Stunden pro Lernbereich (Richtwert laut Lehrplan)">
        <div className="card">
          {aktiveLb.map((l) => {
            const u = ustd.get(l.id) ?? 0;
            if (l.art !== 'pflicht' && u === 0) return null;
            const unter = l.art === 'pflicht' && u < l.richtwertMin;
            return (
              <div key={l.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{l.name}</span>
                  <span className={unter ? 'muted' : ''} style={{ whiteSpace: 'nowrap' }}>
                    {u} / {l.richtwertMin === l.richtwertMax ? l.richtwertMin : `${l.richtwertMin}–${l.richtwertMax}`} Ustd.
                  </span>
                </div>
                <Balken wert={u} max={l.richtwertMax} ueber={u > l.richtwertMax} />
              </div>
            );
          })}
          <div className="muted small">
            Eine Einheit ist eine Doppelstunde (2 Ustd.). Der Lehrplan sieht 25 Pflichtwochen pro Klassenstufe vor; die Richtwerte dürfen variiert werden. Pufferstunden: {ustd.get('puffer') ?? 0} Ustd.
          </div>
        </div>
      </Section>

      <Section
        title={alleTermine ? 'Alle Termine' : 'Nächste Termine'}
        aktion={
          einheiten.length > 12 ? (
            <Button small kind="secondary" onClick={() => setAlleTermine(!alleTermine)}>
              {alleTermine ? 'Weniger' : 'Alle zeigen'}
            </Button>
          ) : undefined
        }
      >
        {sichtbareTermine.length === 0 ? (
          <Empty>Keine offenen Termine.</Empty>
        ) : (
          <List>
            {sichtbareTermine.map((e) => {
              const lb = e.lernbereichId ? lbMap.get(e.lernbereichId) : undefined;
              return (
                <Row
                  key={e.id}
                  to={`/einheit/${e.id}`}
                  title={formatLang(e.datum)}
                  sub={e.istPuffer ? 'Pufferstunde' : lb ? lb.name : e.titel || 'noch nicht verplant'}
                  right={e.status === 'geplant' ? undefined : STATUS_LABEL[e.status]}
                />
              );
            })}
          </List>
        )}
      </Section>

      <div className="btn-row">
        <Link className="btn secondary small" to={`/lernziele?klasse=${klasse.id}`} style={{ textDecoration: 'none' }}>
          🎯 Lernziele dieser Klasse
        </Link>
      </div>

      <Sheet offen={neu} onClose={() => setNeu(false)} titel="Block hinzufügen">
        <SelectField label="Lernbereich" value={neuLb} onChange={(v) => { setNeuLb(v); setNeuAnzahl(v === 'puffer' ? 1 : 4); }} options={optionen} />
        <div className="muted small">Anzahl Einheiten (Doppelstunden)</div>
        <div className="btn-row">
          <Button kind="secondary" onClick={() => setNeuAnzahl(Math.max(1, neuAnzahl - 1))}>−</Button>
          <span style={{ alignSelf: 'center', minWidth: 40, textAlign: 'center', fontSize: 20 }}>{neuAnzahl}</span>
          <Button kind="secondary" onClick={() => setNeuAnzahl(neuAnzahl + 1)}>＋</Button>
        </div>
        <div className="btn-row">
          <Button onClick={blockAnlegen}>Hinzufügen</Button>
          <Button kind="secondary" onClick={() => setNeu(false)}>Abbrechen</Button>
        </div>
      </Sheet>
      {toast}
    </Page>
  );
}
