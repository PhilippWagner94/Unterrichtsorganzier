import { db, TABELLEN, getEinstellung, setEinstellung } from './db';

export const BACKUP_FORMAT = 'unterrichtsorganizer-backup';
export const BACKUP_VERSION = 1;

interface BlobJson {
  __blob: true;
  mime: string;
  data: string; // base64
}

function istBlobJson(v: unknown): v is BlobJson {
  return typeof v === 'object' && v !== null && (v as BlobJson).__blob === true;
}

async function blobZuBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ZuBlob(b64: string, mime: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function zeileZuJson(zeile: Record<string, unknown>): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(zeile)) {
    if (v instanceof Blob) {
      out[k] = { __blob: true, mime: v.type, data: await blobZuBase64(v) } satisfies BlobJson;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function zeileAusJson(zeile: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(zeile)) {
    out[k] = istBlobJson(v) ? base64ZuBlob(v.data, v.mime) : v;
  }
  return out;
}

export interface BackupDatei {
  format: string;
  version: number;
  exportiert: string;
  tabellen: Record<string, Record<string, unknown>[]>;
}

/** Alle Daten als JSON-Text (Bilder als base64 enthalten). */
export async function exportiereAlsText(): Promise<string> {
  const tabellen: BackupDatei['tabellen'] = {};
  for (const name of TABELLEN) {
    const zeilen = (await db.table(name).toArray()) as Record<string, unknown>[];
    tabellen[name] = [];
    for (const z of zeilen) tabellen[name].push(await zeileZuJson(z));
  }
  const datei: BackupDatei = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportiert: new Date().toISOString(),
    tabellen,
  };
  return JSON.stringify(datei);
}

export class BackupFehler extends Error {}

/** Prüft die Backup-Datei und gibt sie geparst zurück. Wirft BackupFehler bei ungültigen Dateien. */
export function parseBackup(text: string): BackupDatei {
  let daten: unknown;
  try {
    daten = JSON.parse(text);
  } catch {
    throw new BackupFehler('Die Datei ist kein gültiges Backup (kein lesbares JSON).');
  }
  const d = daten as Partial<BackupDatei>;
  if (!d || d.format !== BACKUP_FORMAT || typeof d.tabellen !== 'object' || d.tabellen === null) {
    throw new BackupFehler('Die Datei stammt nicht vom Unterrichtsorganizer.');
  }
  if (typeof d.version !== 'number' || d.version > BACKUP_VERSION) {
    throw new BackupFehler('Das Backup stammt von einer neueren App-Version und kann nicht gelesen werden.');
  }
  for (const [name, zeilen] of Object.entries(d.tabellen)) {
    if (!Array.isArray(zeilen)) throw new BackupFehler(`Tabelle „${name}“ ist beschädigt.`);
  }
  return d as BackupDatei;
}

/** Ersetzt alle vorhandenen Daten durch den Inhalt des Backups (in einer Transaktion: alles oder nichts). */
export async function importiereBackup(datei: BackupDatei): Promise<{ zeilen: number }> {
  let anzahl = 0;
  const tabellenObjekte = TABELLEN.map((n) => db.table(n));
  await db.transaction('rw', tabellenObjekte, async () => {
    for (const name of TABELLEN) {
      const tabelle = db.table(name);
      await tabelle.clear();
      const zeilen = (datei.tabellen[name] ?? []).map(zeileAusJson);
      if (zeilen.length) await tabelle.bulkPut(zeilen);
      anzahl += zeilen.length;
    }
  });
  await setEinstellung('letztesBackupImport', new Date().toISOString());
  return { zeilen: anzahl };
}

export function backupDateiname(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `unterrichtsorganizer-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

/**
 * Speichert das Backup: auf dem iPhone über das Teilen-Menü (z. B. „In Dateien sichern“), sonst als Download.
 * Merkt sich den Zeitpunkt des letzten Backups.
 */
export async function sichereBackup(): Promise<'geteilt' | 'heruntergeladen' | 'abgebrochen'> {
  const text = await exportiereAlsText();
  const name = backupDateiname();
  const datei = new File([text], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [datei] })) {
    try {
      await nav.share({ files: [datei], title: 'Unterrichtsorganizer Backup' });
      await setEinstellung('letztesBackup', new Date().toISOString());
      return 'geteilt';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'abgebrochen';
      // sonst: Download als Rückfall
    }
  }
  const url = URL.createObjectURL(datei);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  await setEinstellung('letztesBackup', new Date().toISOString());
  return 'heruntergeladen';
}

export async function letztesBackup(): Promise<string | null> {
  return getEinstellung<string | null>('letztesBackup', null);
}

/** Bittet den Browser, die Daten dauerhaft zu speichern (schützt vor automatischem Löschen durch Safari). */
export async function persistenterSpeicher(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* ignorieren */
  }
  return false;
}
