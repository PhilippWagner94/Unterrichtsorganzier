import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { speichereTextdatei } from '../../db/backup';
import { Button, Card, Check, Page, Section, bestaetige, useToast } from '../../components/ui';
import { MaterialFehler, erzeugeMaterialExport, importiereMaterial, parseMaterial, type MaterialAuswahl } from '../../lib/material';

const NAMEN: Record<string, string> = { spiele: 'Spiele', reihen: 'Methodische Reihen', notizen: 'Notizen', tests: 'Tests', entwuerfe: 'Stundenentwürfe', anhaenge: 'Bilder' };

export default function MaterialPage() {
  const [a, setA] = useState<MaterialAuswahl>({ spiele: true, reihen: true, entwuerfe: true, ausEinheiten: true, tests: true, notizen: false, bilder: false });
  const [toast, zeigeToast] = useToast();
  const datei = useRef<HTMLInputElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  const n = useLiveQuery(async () => ({ spiele: await db.spiele.count(), reihen: await db.reihen.count(), entwuerfe: await db.entwuerfe.count() }), [], { spiele: 0, reihen: 0, entwuerfe: 0 });
  const set = (p: Partial<MaterialAuswahl>) => setA({ ...a, ...p });
  const fmt = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${v} ${NAMEN[k] ?? k}`).join(', ') || 'nichts';

  async function exportieren() {
    setLaeuft(true);
    try {
      const { text, anzahl } = await erzeugeMaterialExport(a);
      const d = new Date().toISOString().slice(0, 10);
      const r = await speichereTextdatei(text, `unterrichtsorganizer-material-${d}.json`, 'Unterrichtsmaterial');
      if (r !== 'abgebrochen') zeigeToast(`Exportiert: ${fmt(anzahl)}`);
    } catch (e) {
      zeigeToast('Export fehlgeschlagen: ' + (e as Error).message);
    } finally { setLaeuft(false); }
  }

  async function importieren(f?: File) {
    if (!f) return;
    try {
      const d = parseMaterial(await f.text());
      const anz = Object.fromEntries(Object.entries(d.tabellen).map(([k, v]) => [k, v.length]));
      if (!bestaetige(`Datei enthält: ${fmt(anz)}.\n\nNur neue Einträge werden hinzugefügt, vorhandene bleiben unverändert. Fortfahren?`)) return;
      const neu = await importiereMaterial(d);
      zeigeToast(`Hinzugefügt: ${fmt(neu)}`);
    } catch (e) {
      zeigeToast(e instanceof MaterialFehler ? e.message : 'Import fehlgeschlagen: ' + (e as Error).message);
    }
  }

  return (
    <Page title="Material teilen" zurueck>
      <Card kind="soft">
        <div className="small">
          Exportiert nur Unterrichtsmaterial, <strong>keine Personendaten</strong>: keine Klassen, Kinder, Geburtstage, Noten, Ergebnisse, Wettkampfteilnehmer, Arbeitszeiten oder Aufgaben. Die Datei kannst du Kolleginnen und Kollegen schicken oder als Grundstock für ein neues Gerät nutzen. (Alle Daten sicherst du unter Mehr → Backup.)
        </div>
      </Card>
      <Section title="Was soll mit?" />
      <Check label={`Spiele (${n?.spiele ?? 0})`} checked={a.spiele} onChange={(v) => set({ spiele: v })} />
      <Check label={`Methodische Reihen (${n?.reihen ?? 0})`} checked={a.reihen} onChange={(v) => set({ reihen: v })} />
      <Check label={`Gespeicherte Stundenentwürfe (${n?.entwuerfe ?? 0})`} checked={a.entwuerfe} onChange={(v) => set({ entwuerfe: v })} />
      <Check label="Inhalte meiner Unterrichtseinheiten als Entwürfe (nur Aufwärmen, Hauptteil, Ausklang, Material, Spiele; ohne Klasse, Datum, Notizen, Reflexion)" checked={a.ausEinheiten} onChange={(v) => set({ ausEinheiten: v })} />
      <Check label="Tests (nur Beschreibung und Bewertungstabelle, ohne Ergebnisse)" checked={a.tests} onChange={(v) => set({ tests: v })} />
      <Check label="Bilder zu Spielen und Reihen" checked={a.bilder} onChange={(v) => set({ bilder: v })} />
      <Check label="Notizen (Achtung: können Persönliches enthalten, bitte vorher prüfen)" checked={a.notizen} onChange={(v) => set({ notizen: v })} />
      <div className="btn-row"><Button onClick={exportieren} disabled={laeuft}>📤 Exportieren</Button></div>

      <Section title="Material importieren" />
      <div className="muted small">Fügt Material aus einer solchen Datei hinzu. Vorhandenes wird nicht überschrieben.</div>
      <input ref={datei} type="file" accept=".json,application/json" hidden onChange={(e) => { importieren(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="btn-row"><Button kind="secondary" onClick={() => datei.current?.click()}>📥 Datei wählen</Button></div>
      {toast}
    </Page>
  );
}
