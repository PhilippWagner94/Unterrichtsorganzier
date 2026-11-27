import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Button, List, Page, Row, Section, useToast, bestaetige } from '../../components/ui';
import {
  BackupFehler, importiereBackup, letztesBackup, parseBackup, persistenterSpeicher, sichereBackup,
} from '../../db/backup';
import { formatDatum } from '../../lib/dates';

export default function MehrPage() {
  const [toast, zeigeToast] = useToast();
  const dateiRef = useRef<HTMLInputElement>(null);
  const backup = useLiveQuery(() => letztesBackup(), [], null);
  const [fest, setFest] = useState<boolean | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  async function sichern() {
    setLaeuft(true);
    try {
      const r = await sichereBackup();
      if (r === 'geteilt') zeigeToast('Backup gespeichert');
      else if (r === 'heruntergeladen') zeigeToast('Backup heruntergeladen (Dateien-App)');
    } catch (e) {
      zeigeToast('Backup fehlgeschlagen: ' + (e as Error).message);
    } finally {
      setLaeuft(false);
    }
  }

  async function einspielen(datei: File | undefined) {
    if (!datei) return;
    try {
      const backupDatei = parseBackup(await datei.text());
      const n = Object.values(backupDatei.tabellen).reduce((s, z) => s + z.length, 0);
      const stand = backupDatei.exportiert ? formatDatum(backupDatei.exportiert.slice(0, 10)) : 'unbekannt';
      if (!bestaetige(`Backup vom ${stand} mit ${n} Einträgen einspielen?\n\nAlle aktuellen Daten auf diesem Gerät werden dabei ersetzt.`)) return;
      await importiereBackup(backupDatei);
      zeigeToast('Backup eingespielt');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      zeigeToast(e instanceof BackupFehler ? e.message : 'Einspielen fehlgeschlagen: ' + (e as Error).message);
    }
  }

  return (
    <Page title="Mehr">
      <Section title="Planung" />
      <List>
        <Row title="⏱ Arbeitszeit und Statistik" sub="Zeiten erfassen, auswerten, vergleichen" to="/arbeitszeit" />
        <Row title="✅ Aufgaben und Verpflichtungen" sub="To-dos, Aufsichten, Beratungen, Gespräche" to="/aufgaben" />
        <Row title="🏆 Wettkampftermine" to="/wettkaempfe" />
        <Row title="📝 Tests und Ergebnisse" to="/tests" />
        <Row title="📊 Notenübersicht" to="/noten" />
        <Row title="📷 Foto importieren (Texterkennung)" to="/foto" />
      </List>

      <Section title="Einrichtung" />
      <List>
        <Row title="🗓 Schuljahr und Ferien" sub="Ferien, freie Tage, aktives Schuljahr" to="/schuljahr" />
        <Row title="📚 Fächer" sub="Welche Fächer du in diesem Schuljahr unterrichtest" to="/faecher" />
        <Row title="🎯 Lehrplan und Lernziele" sub="Lernbereiche, Richtwerte, Lernziele bearbeiten" to="/lernziele" />
      </List>

      <Section title="Teilen" />
      <List>
        <Row title="📤 Material teilen (ohne Personendaten)" sub="Spiele, Methodik, Stundenentwürfe, Tests exportieren und importieren" to="/material" />
      </List>

      <Section title="Daten sichern" />
      <Card>
        <div>
          <strong>Letztes Backup:</strong>{' '}
          {backup ? formatDatum(backup.slice(0, 10)) : 'noch nie'}
        </div>
        <p className="muted small">
          Alle Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig: „Backup sichern“ öffnet das Teilen-Menü, dort z. B. „In Dateien sichern“ (iCloud Drive).
        </p>
        <div className="btn-row">
          <Button onClick={sichern} disabled={laeuft}>💾 Backup sichern</Button>
          <Button kind="secondary" onClick={() => dateiRef.current?.click()}>📥 Backup einspielen</Button>
        </div>
        <input ref={dateiRef} type="file" accept="application/json,.json" hidden onChange={(e) => { void einspielen(e.target.files?.[0]); e.target.value = ''; }} />
        <div className="btn-row">
          <Button small kind="secondary" onClick={async () => setFest(await persistenterSpeicher())}>Dauerhaften Speicher anfordern</Button>
          {fest !== null ? <span className="small" style={{ alignSelf: 'center' }}>{fest ? '✅ aktiv' : '⚠ vom Browser nicht zugesagt'}</span> : null}
        </div>
      </Card>

      <Section title="Hinweise" />
      <Card>
        <div className="small">
          <p style={{ marginTop: 0 }}><strong>Auf dem iPhone installieren:</strong> Seite in Safari öffnen → Teilen-Symbol → „Zum Home-Bildschirm“. Nur so ist der Speicher geschützt und die App funktioniert offline.</p>
          <p style={{ marginBottom: 0 }}>Lehrplan: Fachlehrplan Grundschule Sport Sachsen (2019). Die Zeitrichtwerte gelten pro Klassenstufe und dürfen variiert werden.</p>
        </div>
      </Card>
      {toast}
    </Page>
  );
}
