import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, neueId } from '../../db/db';
import { useAktivesSchuljahr } from '../../db/hooks';
import type { Doppelstufe, Lernbereich, LernbereichArt, Lernziel } from '../../db/types';
import {
  Button, Check, Chip, ChipAuswahl, Empty, Page, Section, Sheet, TextArea, TextField, bestaetige, useToast, NumberField,
} from '../../components/ui';
import { FACH_SPORT_ID } from '../../data/lehrplanSport';
import { lehrplanNachladen } from '../../db/seed';

const ART: { value: LernbereichArt; label: string }[] = [
  { value: 'pflicht', label: 'Pflicht' },
  { value: 'wahl', label: 'Wahl' },
  { value: 'optional', label: 'Optional' },
];
const STUFE: { value: Doppelstufe; label: string }[] = [
  { value: '1/2', label: 'Klasse 1/2' },
  { value: '3/4', label: 'Klasse 3/4' },
];

export default function LernzielePage() {
  const [params] = useSearchParams();
  const klasseId = params.get('klasse');
  const sj = useAktivesSchuljahr();
  const lernbereiche = useLiveQuery(() => db.lernbereiche.orderBy('sortierung').toArray(), [], []) ?? [];
  const lernziele = useLiveQuery(() => db.lernziele.orderBy('sortierung').toArray(), [], []) ?? [];
  const klasse = useLiveQuery(() => (klasseId ? db.klassen.get(klasseId) : undefined), [klasseId]);
  const einheiten = useLiveQuery(() => (klasseId ? db.einheiten.where('klasseId').equals(klasseId).toArray() : []), [klasseId], []) ?? [];
  const marken = useLiveQuery(() => (klasseId && sj ? db.lernzielMarken.where('[klasseId+schuljahrId]').equals([klasseId, sj.id]).toArray() : []), [klasseId, sj?.id], []) ?? [];
  const [offen, setOffen] = useState<Set<string>>(new Set());
  const [toast, zeigeToast] = useToast();

  const [lbSheet, setLbSheet] = useState<Lernbereich | 'neu' | null>(null);
  const [lbName, setLbName] = useState('');
  const [lbKuerzel, setLbKuerzel] = useState('');
  const [lbMin, setLbMin] = useState<number | undefined>(8);
  const [lbMax, setLbMax] = useState<number | undefined>(18);
  const [lbArt, setLbArt] = useState<LernbereichArt>('pflicht');
  const [lbAktiv, setLbAktiv] = useState(true);

  const [zSheet, setZSheet] = useState<{ ziel?: Lernziel; lernbereichId: string } | null>(null);
  const [zText, setZText] = useState('');
  const [zStufe, setZStufe] = useState<Doppelstufe>('1/2');

  function toggle(id: string) {
    const n = new Set(offen);
    n.has(id) ? n.delete(id) : n.add(id);
    setOffen(n);
  }

  function oeffneLb(l: Lernbereich | 'neu') {
    if (l === 'neu') { setLbName(''); setLbKuerzel(''); setLbMin(8); setLbMax(18); setLbArt('pflicht'); setLbAktiv(true); }
    else { setLbName(l.name); setLbKuerzel(l.kuerzel); setLbMin(l.richtwertMin); setLbMax(l.richtwertMax); setLbArt(l.art); setLbAktiv(l.aktiv); }
    setLbSheet(l);
  }

  async function speichereLb() {
    if (!lbName.trim()) return;
    const bestehend = lbSheet && lbSheet !== 'neu' ? lbSheet : undefined;
    await db.lernbereiche.put({
      id: bestehend?.id ?? neueId(),
      fachId: bestehend?.fachId ?? FACH_SPORT_ID,
      name: lbName.trim(),
      kuerzel: lbKuerzel.trim() || lbName.trim().slice(0, 2).toUpperCase(),
      richtwertMin: lbMin ?? 0,
      richtwertMax: lbMax ?? lbMin ?? 0,
      art: lbArt,
      aktiv: lbAktiv,
      farbe: bestehend?.farbe ?? '#7f8c8d',
      sortierung: bestehend?.sortierung ?? lernbereiche.length + 1,
    });
    setLbSheet(null);
  }

  function oeffneZiel(lernbereichId: string, ziel?: Lernziel) {
    setZText(ziel?.text ?? '');
    setZStufe(ziel?.doppelstufe ?? '1/2');
    setZSheet({ ziel, lernbereichId });
  }

  async function speichereZiel() {
    if (!zSheet || !zText.trim()) return;
    await db.lernziele.put({
      id: zSheet.ziel?.id ?? neueId(),
      lernbereichId: zSheet.lernbereichId,
      doppelstufe: zStufe,
      text: zText.trim(),
      sortierung: zSheet.ziel?.sortierung ?? lernziele.length + 1,
    });
    setZSheet(null);
  }

  function status(zielId: string): 'gehalten' | 'geplant' | null {
    const hit = einheiten.filter((e) => e.zielIds.includes(zielId));
    if (hit.some((e) => e.status === 'gehalten')) return 'gehalten';
    if (hit.some((e) => e.status === 'geplant')) return 'geplant';
    return null;
  }
  const markiert = (zielId: string) => marken.find((m) => m.lernzielId === zielId);

  async function toggleNicht(zielId: string) {
    if (!klasseId || !sj) return;
    const m = markiert(zielId);
    if (m) await db.lernzielMarken.delete(m.id);
    else await db.lernzielMarken.add({ id: neueId(), klasseId, schuljahrId: sj.id, lernzielId: zielId, status: 'nicht' });
  }

  return (
    <Page title={klasse ? `Lernziele ${klasse.name}` : 'Lehrplan und Lernziele'} zurueck>
      {klasse ? (
        <div className="muted small" style={{ marginBottom: 8 }}>
          Zeigt, welche Lernziele in Einheiten dieser Klasse geplant oder gehalten sind. „Nicht behandelt“ kannst du pro Schuljahr markieren. Lernziele ordnest du in der Einheit zu.
        </div>
      ) : (
        <div className="muted small" style={{ marginBottom: 8 }}>
          Fachlehrplan Sport Grundschule Sachsen 2019 als bearbeitbare Vorlage. Zeitrichtwerte (Ustd.) gelten pro Klassenstufe.
        </div>
      )}

      {lernbereiche.length === 0 ? <Empty>Keine Lernbereiche vorhanden.</Empty> : null}
      {lernbereiche.map((l) => {
        const ziele = lernziele.filter((z) => z.lernbereichId === l.id);
        const isOffen = offen.has(l.id);
        return (
          <div key={l.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => toggle(l.id)}>
              <span style={{ color: l.farbe }}>●</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{l.name}</div>
                <div className="muted small">
                  {l.richtwertMin === l.richtwertMax ? l.richtwertMin : `${l.richtwertMin}–${l.richtwertMax}`} Ustd. · {ART.find((a) => a.value === l.art)?.label}{l.aktiv ? '' : ' · deaktiviert'} · {ziele.length} Ziele
                </div>
              </div>
              <span className="muted">{isOffen ? '▾' : '▸'}</span>
            </div>
            {isOffen ? (
              <div style={{ marginTop: 8 }}>
                {(['1/2', '3/4'] as Doppelstufe[]).map((st) => {
                  const liste = ziele.filter((z) => z.doppelstufe === st);
                  if (!liste.length) return null;
                  return (
                    <div key={st}>
                      <div className="muted small" style={{ margin: '8px 0 4px', fontWeight: 600 }}>Klasse {st}</div>
                      {liste.map((z) => {
                        const s = klasseId ? status(z.id) : null;
                        const m = klasseId ? markiert(z.id) : undefined;
                        return (
                          <div key={z.id} style={{ borderTop: '1px solid var(--line)', padding: '8px 0' }}>
                            <div onClick={() => oeffneZiel(l.id, z)} style={{ cursor: 'pointer' }}>{z.text}</div>
                            {klasseId ? (
                              <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                {s === 'gehalten' ? <Chip>gehalten</Chip> : s === 'geplant' ? <Chip kind="warn">geplant</Chip> : <Chip kind="gray">offen</Chip>}
                                <Check label="nicht behandelt" checked={!!m} onChange={() => toggleNicht(z.id)} />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <div className="btn-row">
                  <Button small kind="secondary" onClick={() => oeffneZiel(l.id)}>＋ Lernziel</Button>
                  <Button small kind="secondary" onClick={() => oeffneLb(l)}>Lernbereich bearbeiten</Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="btn-row">
        <Button small onClick={() => oeffneLb('neu')}>＋ Lernbereich</Button>
        <Button small kind="secondary" onClick={async () => zeigeToast(`${await lehrplanNachladen()} fehlende Einträge aus der Lehrplan-Vorlage ergänzt`)}>
          Lehrplan-Vorlage nachladen
        </Button>
      </div>

      <Sheet offen={lbSheet !== null} onClose={() => setLbSheet(null)} titel={lbSheet === 'neu' ? 'Neuer Lernbereich' : 'Lernbereich bearbeiten'}>
        <TextField label="Name" value={lbName} onChange={setLbName} />
        <TextField label="Kürzel (2–3 Zeichen)" value={lbKuerzel} onChange={setLbKuerzel} />
        <div className="grid2">
          <NumberField label="Richtwert min (Ustd.)" value={lbMin} onChange={setLbMin} />
          <NumberField label="Richtwert max (Ustd.)" value={lbMax} onChange={setLbMax} />
        </div>
        <ChipAuswahl optionen={ART} wert={lbArt} onChange={setLbArt} />
        <Check label="Aktiv (im Jahresplan auswählbar)" checked={lbAktiv} onChange={setLbAktiv} />
        <div className="btn-row">
          <Button onClick={speichereLb}>Speichern</Button>
          <Button kind="secondary" onClick={() => setLbSheet(null)}>Abbrechen</Button>
          {lbSheet && lbSheet !== 'neu' ? (
            <Button kind="danger" onClick={async () => {
              if (!bestaetige('Lernbereich samt Lernzielen löschen?')) return;
              await db.lernziele.where('lernbereichId').equals(lbSheet.id).delete();
              await db.lernbereiche.delete(lbSheet.id);
              setLbSheet(null);
            }}>Löschen</Button>
          ) : null}
        </div>
      </Sheet>

      <Sheet offen={zSheet !== null} onClose={() => setZSheet(null)} titel={zSheet?.ziel ? 'Lernziel bearbeiten' : 'Neues Lernziel'}>
        <TextArea label="Lernziel" value={zText} onChange={setZText} rows={4} />
        <ChipAuswahl optionen={STUFE} wert={zStufe} onChange={setZStufe} />
        <div className="btn-row">
          <Button onClick={speichereZiel}>Speichern</Button>
          <Button kind="secondary" onClick={() => setZSheet(null)}>Abbrechen</Button>
          {zSheet?.ziel ? (
            <Button kind="danger" onClick={async () => { await db.lernziele.delete(zSheet.ziel!.id); setZSheet(null); }}>Löschen</Button>
          ) : null}
        </div>
      </Sheet>
      {toast}
    </Page>
  );
}
