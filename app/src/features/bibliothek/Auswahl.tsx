// Auswahl-Fenster für Spiele und methodische Reihen (wird im Einheiten-Editor verwendet).

export interface AuswahlProps {
  offen: boolean;
  onClose: () => void;
  gewaehlt: string[]; // IDs
  onChange: (ids: string[]) => void;
}

export function SpielAuswahl(_props: AuswahlProps) {
  return null;
}

export function ReiheAuswahl(_props: AuswahlProps) {
  return null;
}
