import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useKlassenAktiv } from '../../db/hooks';
import { Button, Card, Check, Chip, ChipAuswahl, Empty, List, Page, Row, Section, TextArea, TextField, bestaetige, useToast } from '../../components/ui';
import { Anhaenge } from '../../components/Anhaenge';
import { useAutosave } from '../../lib/useAutosave';
import { markiereAusfall } from '../../lib/planAktionen';
import { vollerName } from '../../lib/schuljahr';

export default function WettkampfPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { daten: w, set, flush } = useAutosave(db.wettkaempfe, id);
  const klassen = useKlassenAktiv();
  const alleSchueler = useLiveQuery(() => db.schueler.toArray(), [], []) ?? [];
  const einheitenAmTag = useLiveQuery(() => (w ? db.einheiten.where('datum').equals(w.datum).toArray() : []), [w?.datum], []) ?? [];
  const alleKlassen = useLiveQuery(() => db.klassen.toArray(), [], []) ?? [];
  const [neuerPunkt, setNeuerPunkt] = useState('');
  const [toast, zeigeToast] = useToast();

  if (w === undefined) return <Page title="Wettkampf" zurueck><Empty>Lädt …</Empty></Page>;
  if (w === null) return <Page title="Wettkampf" zurueck><Empty>Wettkampf nicht gefunden.</Empty></Page>;

  const betroffene = klassen.filter((k) => w.klassenstufen.includes(k.stufe));
  const klasseName = (kid: string) => alleKlassen.find((k) => k.id === kid)?.name ?? '?';
  const relevantEinheiten = einheitenAmTag.filter((e) => e.status === 'geplant' || e.wettkampfId === w.id);

  function stufeUmschalten(st: number) {
    if (!w) return;
    const an = w.klassenstufen.includes(st);
    set({ klassenstufen: an ? w.klassenstufen.filter((x) => x !== st) : [...w.klassenstufen, st].sort() });
  }
  function kindUmschalten(sid: string, an: boolean) {
    if (!w) return;
    set({ schuelerIds: an ? [...w.schuelerIds, sid] : w.schuelerIds.filter((x) => x !== sid) });
  }
  function klasseSetzen(kid: string, alle: boolean) {
    if (!w) return;
    const ids = alleSchueler.filter((s) => s.klasseId === kid).map((s) => s.id);
    const ohne = w.schuelerIds.filter((x) => !ids.includes(x));
    set({ schuelerIds: alle ? [...ohne, ...ids] : ohne });
  }

  return (
    <Page title={w.name || 'Wettkampf'} zurueck>
      <TextField label="Name" value={w.name} onChange={(v) => set({ name: v })} />
      <TextField label="Datum" type="date" value={w.datum} onChange={(v) => v && set({ datum: v })} />
      <TextField label="Ort" value={w.ort} onChange={(v) => set({ ort: v })} />
      <TextArea label="Notizen" value={w.notizen} onChange={(v) => set({ notizen: v })} />

      <div className="muted small">Betroffene Klassenstufen</div>
      <div className="chips">
        {[1, 2, 3, 4].map((st) => (
          <button key={st} className={`chip-btn ${w.klassenstufen.includes(st) ? 'on' : ''}`} onClick={() => stufeUmschalten(st)}>Klasse {st}</button>
        ))}
      </div>

      <div className="muted small">Teilnahme</div>
      <ChipAuswahl
        optionen={[{ value: 'kinder' as const, label: 'Mit Kindern' }, { value: 'lehrkraft' as const, label: 'Nur Lehrkraft (keine Kinder)' }]}
        wert={w.teilnahme}
        onChange={(v) => set({ teilnahme: v })}
      />

      {w.teilnahme === 'kinder' ? (
        <Section title={`Kinder (${w.schuelerIds.length} ausgewählt)`}>
          {w.klassenstufen.length === 0 ? <Empty>Wähle zuerst die betroffenen Klassenstufen.</Empty> : null}
          {betroffene.map(({ klasse }) => {
            const kinder = alleSchueler.filter((s) => s.klasseId === klasse.id).sort((a, b) => a.nachname.localeCompare(b.nachname, 'de'));
            return (
              <Card key={klasse.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Klasse {klasse.name}</strong>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <Button small kind="secondary" onClick={() => klasseSetzen(klasse.id, true)}>Alle</Button>
                    <Button small kind="secondary" onClick={() => klasseSetzen(klasse.id, false)}>Keine</Button>
                  </span>
                </div>
                {kinder.length === 0 ? <div className="muted small">Keine Kinder in dieser Klasse.</div> : null}
                {kinder.map((s) => (
                  <Check key={s.id} label={vollerName(s)} checked={w.schuelerIds.includes(s.id)} onChange={(v) => kindUmschalten(s.id, v)} />
                ))}
              </Card>
            );
          })}
        </Section>
      ) : (
        <Card kind="soft">Nur die Lehrkraft nimmt teil, es fahren keine Kinder mit.</Card>
      )}

      <Section title="Checkliste (optional)" />
      <Card>
        {w.checkliste.length === 0 ? <div className="muted small">Noch keine Punkte, z. B. Anmeldung, Einverständnis, Treffzeit.</div> : null}
        {w.checkliste.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <Check label={p.text} checked={p.erledigt} onChange={(v) => set({ checkliste: w.checkliste.map((x, k) => (k === i ? { ...x, erledigt: v } : x)) })} />
            </div>
            <Button small kind="secondary" onClick={() => set({ checkliste: w.checkliste.filter((_, k) => k !== i) })}>✕</Button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="text" value={neuerPunkt} placeholder="Neuer Punkt" onChange={(e) => setNeuerPunkt(e.target.value)} />
          <Button
            disabled={!neuerPunkt.trim()}
            onClick={() => { set({ checkliste: [...w.checkliste, { text: neuerPunkt.trim(), erledigt: false }] }); setNeuerPunkt(''); }}
          >
            ＋
          </Button>
        </div>
      </Card>

      <Section title="Unterricht an diesem Tag" />
      {relevantEinheiten.length === 0 ? (
        <div className="muted small" style={{ marginBottom: 12 }}>An diesem Datum ist keine geplante Einheit eingetragen.</div>
      ) : (
        <List>
          {relevantEinheiten.map((e) =>
            e.status === 'geplant' ? (
              <div key={e.id} className="row">
                <div className="main">
                  <div className="title">Klasse {klasseName(e.klasseId)}</div>
                  <div className="sub">{e.titel || 'geplante Einheit'}</div>
                </div>
                <Button
                  small
                  onClick={async () => {
                    await flush();
                    await markiereAusfall(e.id, `Wettkampf: ${w.name}`, 'nachruecken', w.id);
                    zeigeToast('Als Ausfall markiert, der Plan rückt nach');
                  }}
                >
                  Ausfall
                </Button>
              </div>
            ) : (
              <Row key={e.id} title={`Klasse ${klasseName(e.klasseId)}`} sub="Ausfall (Wettkampf)" to={`/einheit/${e.id}`} />
            ),
          )}
        </List>
      )}

      <div className="muted small">Fotos und Unterlagen</div>
      <Anhaenge bezugTyp="wettkampf" bezugId={w.id} />

      <div className="btn-row">
        <Button
          kind="danger"
          onClick={async () => {
            if (!bestaetige(`„${w.name}“ löschen?`)) return;
            await flush();
            await db.anhaenge.where('[bezugTyp+bezugId]').equals(['wettkampf', w.id]).delete();
            await db.wettkaempfe.delete(w.id);
            nav(-1);
          }}
        >
          Termin löschen
        </Button>
      </div>
      {w.klassenstufen.length ? <div>{w.klassenstufen.map((k) => <Chip key={k}>Klasse {k}</Chip>)}</div> : null}
      {toast}
    </Page>
  );
}
