// Ferien und unterrichtsfreie Tage Sachsen (Vorlage, jederzeit in der App bearbeitbar).
// Schuljahr 2026/27: Verwaltungsvorschrift „Bedarf und Schuljahresablauf 2026/2027“ (revosax.sachsen.de, Nr. 21547).
// Schuljahr 2027/28: Sekundärquelle (schulferien.eu), bitte mit der amtlichen Ferienordnung abgleichen.
// Gesetzliche Feiertage werden berechnet (lib/feiertage.ts) und müssen hier nicht stehen.

import type { FreierTagArt } from '../db/types';

export interface SchuljahrVorlage {
  startjahr: number;
  start: string; // erster Unterrichtstag
  ende: string; // letzter Unterrichtstag
  geprueft: boolean; // aus amtlicher Quelle?
  tage: { von: string; bis: string; bezeichnung: string; art: FreierTagArt }[];
}

export const SCHULJAHRE_VORLAGE: SchuljahrVorlage[] = [
  {
    startjahr: 2026,
    start: '2026-08-17',
    ende: '2027-07-09',
    geprueft: true,
    tage: [
      { von: '2026-10-12', bis: '2026-10-24', bezeichnung: 'Herbstferien', art: 'ferien' },
      { von: '2026-12-23', bis: '2027-01-02', bezeichnung: 'Weihnachtsferien', art: 'ferien' },
      { von: '2027-02-08', bis: '2027-02-19', bezeichnung: 'Winterferien', art: 'ferien' },
      { von: '2027-03-26', bis: '2027-04-02', bezeichnung: 'Osterferien', art: 'ferien' },
      { von: '2027-05-07', bis: '2027-05-07', bezeichnung: 'Unterrichtsfreier Tag', art: 'frei' },
      { von: '2027-05-15', bis: '2027-05-18', bezeichnung: 'Pfingstferien', art: 'ferien' },
    ],
  },
  {
    startjahr: 2027,
    start: '2027-08-23',
    ende: '2028-07-21',
    geprueft: false,
    tage: [
      { von: '2027-10-11', bis: '2027-10-23', bezeichnung: 'Herbstferien', art: 'ferien' },
      { von: '2027-12-23', bis: '2028-01-01', bezeichnung: 'Weihnachtsferien', art: 'ferien' },
      { von: '2028-02-14', bis: '2028-02-26', bezeichnung: 'Winterferien', art: 'ferien' },
      { von: '2028-04-14', bis: '2028-04-22', bezeichnung: 'Osterferien', art: 'ferien' },
      { von: '2028-05-26', bis: '2028-05-26', bezeichnung: 'Brückentag', art: 'frei' },
    ],
  },
];
