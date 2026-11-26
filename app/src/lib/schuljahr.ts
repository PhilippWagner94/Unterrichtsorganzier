import type { Datum, Klasse, Schueler } from '../db/types';
import { fromYmd } from './dates';

/** Startjahr des Schuljahres, in dem das Datum liegt (Schuljahr beginnt am 1. August). */
export function schuljahrStartjahr(datum: Datum): number {
  const d = fromYmd(datum);
  return d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
}

export function schuljahrName(startjahr: number): string {
  return `${startjahr}/${String(startjahr + 1).slice(2)}`;
}

/** Klassenstufe einer Klasse im Schuljahr mit dem angegebenen Startjahr (Berechnung, nicht gespeichert). */
export function klassenstufe(klasse: Pick<Klasse, 'einschulungsjahr'>, schuljahrStart: number): number {
  return schuljahrStart - klasse.einschulungsjahr + 1;
}

export function klassenstufeAm(klasse: Pick<Klasse, 'einschulungsjahr'>, datum: Datum): number {
  return klassenstufe(klasse, schuljahrStartjahr(datum));
}

/** Klasse ist in diesem Schuljahr aktiv (Stufe 1 bis 4). */
export function istAktiv(klasse: Klasse, datum: Datum): boolean {
  if (klasse.archiviert) return false;
  const st = klassenstufeAm(klasse, datum);
  return st >= 1 && st <= 4;
}

export function doppelstufeFuerKlassenstufe(stufe: number): '1/2' | '3/4' {
  return stufe <= 2 ? '1/2' : '3/4';
}

export function vollerName(s: Pick<Schueler, 'vorname' | 'nachname'>): string {
  return `${s.vorname} ${s.nachname}`.trim();
}
