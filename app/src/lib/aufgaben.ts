import type { Aufgabe, Datum, FreierTag } from '../db/types';
import { isoWoche, wochentag } from './dates';
import { freiBezeichnung } from './plan';

export const ART_LABEL: Record<NonNullable<Aufgabe['art']>, string> = {
  fortbildung: 'Fortbildung',
  aufsicht_hof: 'Pausenaufsicht Hof',
  aufsicht_mittag: 'Aufsicht Mittagspause',
  fruehaufsicht: 'Frühaufsicht',
  beratung: 'Dienstberatung',
  elterngespraech: 'Elterngespräch',
  sonstiges: 'Sonstiges',
};

export const KATEGORIE_LABEL: Record<NonNullable<Aufgabe['kategorie']>, string> = {
  vorbereitung: 'Vorbereitung',
  verwaltung: 'Verwaltung',
  elternkontakt: 'Elternkontakt',
  sonstiges: 'Sonstiges',
};

/** Findet an einem Tag stattfindende Verpflichtungen (einmalig oder wiederkehrend; wiederkehrende entfallen in Ferien/an freien Tagen). */
export function verpflichtungenAm(liste: Aufgabe[], datum: Datum, freieTage: FreierTag[]): Aufgabe[] {
  const wt = wochentag(datum);
  const frei = !!freiBezeichnung(datum, freieTage);
  return liste
    .filter((a) => a.typ === 'verpflichtung')
    .filter((a) => {
      const w = a.wiederholung ?? 'einmalig';
      if (w === 'einmalig') {
        if (!a.faellig) return false;
        if (!a.bisDatum || a.bisDatum <= a.faellig) return a.faellig === datum;
        return datum >= a.faellig && datum <= a.bisDatum && wt <= 5; // mehrtägig: nur Werktage
      }
      if (frei || a.wochentag !== wt) return false;
      if (w === 'zweiwoechentlich') return isoWoche(datum) % 2 === (a.woche === 'gerade' ? 0 : 1);
      return true;
    })
    .sort((a, b) => (a.zeit ?? '').localeCompare(b.zeit ?? ''));
}

/** Offene Aufgaben, die an einem Tag fällig sind. */
export function aufgabenAm(liste: Aufgabe[], datum: Datum): Aufgabe[] {
  return liste.filter((a) => a.typ === 'aufgabe' && !a.erledigt && a.faellig === datum);
}

export const ueberfaellig = (liste: Aufgabe[], heute: Datum) =>
  liste.filter((a) => a.typ === 'aufgabe' && !a.erledigt && a.faellig && a.faellig < heute).sort((a, b) => a.faellig!.localeCompare(b.faellig!));

export const ohneDatum = (liste: Aufgabe[]) => liste.filter((a) => a.typ === 'aufgabe' && !a.erledigt && !a.faellig);
