// Fachlehrplan Sport Grundschule Sachsen (2019), Lernbereiche und verbindliche Lernziele.
// Quelle: Sächsisches Staatsministerium für Kultus, Lehrplan Grundschule Sport (GS – SPO).
// Die Texte sind zusammengefasst; maßgeblich ist die Original-PDF (docs/lehrplan/lp_gs_sport_2019.pdf bzw. Repo-Wurzel).

import type { Doppelstufe, LernbereichArt } from '../db/types';

export const FACH_SPORT_ID = 'fach-sport';

export interface LernbereichVorlage {
  key: string;
  name: string;
  kuerzel: string;
  richtwertMin: number;
  richtwertMax: number;
  art: LernbereichArt;
  aktiv: boolean;
  farbe: string;
}

export const LERNBEREICHE: LernbereichVorlage[] = [
  { key: 'la', name: 'Leichtathletische Übungen', kuerzel: 'LA', richtwertMin: 14, richtwertMax: 24, art: 'pflicht', aktiv: true, farbe: '#e67e22' },
  { key: 'sp', name: 'Spiele und Spielformen', kuerzel: 'SP', richtwertMin: 8, richtwertMax: 18, art: 'pflicht', aktiv: true, farbe: '#2980b9' },
  { key: 'tu', name: 'Turnerische Übungen', kuerzel: 'TU', richtwertMin: 8, richtwertMax: 18, art: 'pflicht', aktiv: true, farbe: '#8e44ad' },
  { key: 'gt', name: 'Gymnastisch-tänzerische Übungen', kuerzel: 'GT', richtwertMin: 5, richtwertMax: 10, art: 'pflicht', aktiv: true, farbe: '#d35480' },
  { key: 'ws', name: 'Wintersport (oder Eislauf)', kuerzel: 'WS', richtwertMin: 5, richtwertMax: 9, art: 'optional', aktiv: true, farbe: '#16a0b8' },
  { key: 'sw', name: 'Schwimmen (läuft separat)', kuerzel: 'SW', richtwertMin: 35, richtwertMax: 35, art: 'optional', aktiv: false, farbe: '#2471a3' },
  { key: 'bt', name: 'Motorische Basistests', kuerzel: 'MB', richtwertMin: 0, richtwertMax: 0, art: 'optional', aktiv: true, farbe: '#c0392b' },
  { key: 'wb1', name: 'Wahlbereich: Bewegung in der Natur', kuerzel: 'W1', richtwertMin: 4, richtwertMax: 4, art: 'wahl', aktiv: true, farbe: '#27ae60' },
  { key: 'wb2', name: 'Wahlbereich: Mini-Sportspiele', kuerzel: 'W2', richtwertMin: 4, richtwertMax: 4, art: 'wahl', aktiv: true, farbe: '#27ae60' },
  { key: 'wb3', name: 'Wahlbereich: Kleine Rückenschule', kuerzel: 'W3', richtwertMin: 4, richtwertMax: 4, art: 'wahl', aktiv: true, farbe: '#27ae60' },
  { key: 'wb4', name: 'Wahlbereich: Olympische Spiele', kuerzel: 'W4', richtwertMin: 4, richtwertMax: 4, art: 'wahl', aktiv: true, farbe: '#27ae60' },
  { key: 'wb5', name: 'Wahlbereich: Koordinative Fähigkeiten', kuerzel: 'W5', richtwertMin: 4, richtwertMax: 4, art: 'wahl', aktiv: true, farbe: '#27ae60' },
];

export interface LernzielVorlage {
  lb: string;
  stufe: Doppelstufe;
  text: string;
}

const z = (lb: string, stufe: Doppelstufe, text: string): LernzielVorlage => ({ lb, stufe, text });

export const LERNZIELE: LernzielVorlage[] = [
  // --- LB 1 Leichtathletik, Klasse 1/2 ---
  z('la', '1/2', 'Erkunden und Üben von Formen des schnellen Laufens: spielerisch, Laufexperimente, schnell starten und laufen, Startkommando und Hochstart kennen'),
  z('la', '1/2', 'Erkunden und Üben von Formen des Weit- und Hochspringens: vielfältig weit und hoch springen, Bewegungsablauf Weit- und Hochsprung kennenlernen'),
  z('la', '1/2', 'Erkunden und Üben von Formen des Werfens: verschiedene Wurfgegenstände, Flugeigenschaften, Schlagwurf aus der Wurfauslage anbahnen'),
  z('la', '1/2', 'Üben von Formen des ausdauernden Laufens: bis 10 min ohne Pause im gleichmäßigen Tempo laufen'),
  z('la', '1/2', 'Erkunden von Bewegungsmöglichkeiten in der Natur: Bewegungs- und Naturerlebnis verbinden'),
  // --- LB 1 Leichtathletik, Klasse 3/4 ---
  z('la', '3/4', 'Verbessern und Anwenden vielfältiger Formen des schnellen Laufens: Lauf-ABC, Lauftechnik, Sprintläufe bis 50 m'),
  z('la', '3/4', 'Kennen von Startformen und ihren Kommandos: Hochstart und andere Startformen'),
  z('la', '3/4', 'Anwenden vielfältiger Formen des Weit- und Hochspringens: Weitsprungtechnik anwenden, eine Hochsprungtechnik erlernen, Leistungssprünge'),
  z('la', '3/4', 'Anwenden vielfältiger Formen des Werfens und Stoßens: Schlagwurf aus der Wurfauslage verbessern und festigen, Fremd- und Selbsteinschätzung'),
  z('la', '3/4', 'Anwenden von Lauf-, Sprung- und Wurfformen beim gemeinsamen Wetteifern: Spielregeln modifizieren, unterschiedliche Leistungen akzeptieren'),
  z('la', '3/4', 'Anwenden von Formen des ausdauernden Laufens: bis 15 min ohne Pause in gleichmäßigem Tempo, Freizeitdauerlauf kennenlernen'),
  z('la', '3/4', 'Anwenden von Bewegungsmöglichkeiten in der Natur: Orientierungsläufe, Walken, Geocaching'),
  // --- LB 2 Spiele, Klasse 1/2 ---
  z('sp', '1/2', 'Verbessern und Üben motorischer Fähigkeiten und Fertigkeiten in Laufspielen: Wettläufe, Staffeln, Platzsuchspiele, Haschespiele'),
  z('sp', '1/2', 'Üben elementarer motorischer Fertigkeiten mit Bällen und anderen Spielgeräten: Rollen, Treiben, Stoßen, Werfen, Treffen, Fangen, Ballgewöhnung'),
  z('sp', '1/2', 'Verbessern der Spielfähigkeit: Bewegungssicherheit, Gruppenbildung, Spannung und Dramatik erleben, selbst gesetzte Regeln aushandeln'),
  z('sp', '1/2', 'Verbessern der konditionellen Fähigkeiten im Spiel: Kraft und Ausdauer schulen'),
  z('sp', '1/2', 'Anwenden von Freizeitspielen in der Kleingruppe: Spiele für Freizeit und Pause'),
  // --- LB 2 Spiele, Klasse 3/4 ---
  z('sp', '3/4', 'Anwenden motorischer Fähigkeiten und Fertigkeiten in Laufspielen: Wettläufe, Staffeln, Platzsuchspiele, Haschespiele'),
  z('sp', '3/4', 'Anwenden elementarer motorischer Fertigkeiten mit Bällen und Spielgeräten: Werfen, Treffen, Fangen, Prellen, Führen, Dribbeln, Komplexübungen'),
  z('sp', '3/4', 'Verbessern der Spielfähigkeit: Spielrollen erfassen, Regeln erklären, einhalten und verändern, Schieds- und Kampfrichtertätigkeit'),
  z('sp', '3/4', 'Verbessern der konditionellen Fähigkeiten im Spiel: Kraft, Ausdauer und Schnelligkeit schulen'),
  z('sp', '3/4', 'Erkunden und Üben von Freizeitsportarten: Trendsportarten, Spiele anderer Länder, Tischtennis, Federball, Floorball, Frisbee'),
  // --- LB 3 Turnen, Klasse 1/2 ---
  z('tu', '1/2', 'Erkunden und Üben vielfältiger Bewegungen an Geräten: Klettern, Hangeln, Balancieren, Rutschen; gemeinsam sicher auf- und abbauen'),
  z('tu', '1/2', 'Erkunden und Üben des vielfältigen Rollens: Rolle vorwärts/rückwärts, sich gegenseitig helfen und korrigieren'),
  z('tu', '1/2', 'Erkunden und Üben einfacher Turnelemente in ungewöhnlichen Körperlagen: Kniehang, Hocksturzhang oder Hüfthang, Griffarten'),
  z('tu', '1/2', 'Üben des beidbeinigen Abspringens von/über unterschiedliche Geräte: Aufsprünge, Drehsprunghocke, Niedersprünge'),
  z('tu', '1/2', 'Üben von Formen des Miteinanderturnens: Zauberschnur, Schwungtuch, Rundseil'),
  z('tu', '1/2', 'Üben der Gleichgewichtsfähigkeit: Balancierübungen auf unterschiedlichen Geräten, Gegenstände balancieren und jonglieren'),
  z('tu', '1/2', 'Verbessern der Kraftfähigkeiten: Armzug-, Stütz-, Rumpf- und Sprungkraft, Beweglichkeit, Spannung und Entspannung'),
  // --- LB 3 Turnen, Klasse 3/4 ---
  z('tu', '3/4', 'Festigen vielfältiger Bewegungen an Geräten: Gerätekombinationen und kurze Gerätebahnen, sicheren Geräteauf- und -abbau selbstständig organisieren'),
  z('tu', '3/4', 'Festigen des vielfältigen Rollens: Rolle mit veränderter Ausgangs- und Endstellung, Übungsverbindungen, Rollen auf Geräten'),
  z('tu', '3/4', 'Üben einfacher Turnelemente in ungewöhnlichen Körperlagen: Hüftabzug, Knieliegehang, Handstand, Kopfstand gehockt, Vorübungen Rad'),
  z('tu', '3/4', 'Beherrschen des beidbeinigen Abspringens von/über Geräte: Sprunggrätsche, Aufhocken (Kasten oder Bock 0,80–1,00 m)'),
  z('tu', '3/4', 'Anwenden von Formen des Miteinanderturnens: mindestens ein Verbindungselement, Pyramidenbau, Synchron-, Partner- und Gruppenturnen'),
  z('tu', '3/4', 'Verbessern der Gleichgewichtsfähigkeit: Kniewaage und Standwaage, Übungsverbindungen auf Bank und Balken'),
  z('tu', '3/4', 'Verbessern der Kraftfähigkeiten: Fitness-Studio in der Turnhalle, Leistungsentwicklungskarten, Rangeln und Raufen, Stretching'),
  z('tu', '3/4', 'Anwenden von Formen des Miteinanderturnens und Spielens im Freien: Rollbrett, Roller, Inlineskater, Slackline, Einrad, Stelzen u. a.'),
  // --- LB 4 Gymnastik/Tanz, Klasse 1/2 ---
  z('gt', '1/2', 'Erkunden und Üben von Bewegungen mit Materialien und Handgeräten: Ball, Seil, Reifen, Tücher, Band; erste gymnastische Fertigkeiten'),
  z('gt', '1/2', 'Verbessern der Rhythmusfähigkeit: Schrittarten nach vorgegebenen oder eigenen Rhythmen gestalten'),
  z('gt', '1/2', 'Gestalten von Bewegungsaufgaben – einzeln und gemeinsam: Bewegungslieder und -geschichten, Kindertanzlieder verschiedener Kulturen'),
  z('gt', '1/2', 'Verbessern der Wahrnehmungsfähigkeit: Spiele und Übungen zur Schulung der Sinne'),
  z('gt', '1/2', 'Verbessern einer zweckmäßigen Körperhaltung: Spannungs- und Entspannungsübungen, Funktionsgymnastik, Fantasiereisen'),
  // --- LB 4 Gymnastik/Tanz, Klasse 3/4 ---
  z('gt', '3/4', 'Gestalten von Bewegungsaufgaben mit und ohne Handgeräte: besonders mit dem Seil, vom Seilspringen zum Rope-Skipping'),
  z('gt', '3/4', 'Verbessern der Rhythmusfähigkeit: Grundschritte der Aerobic, rhythmische Vorgaben'),
  z('gt', '3/4', 'Gestalten von Bewegungsaufgaben – einzeln und gemeinsam: Alltagsmaterialien, Tänze gemeinsam gestalten, Tänze anderer Kulturen'),
  z('gt', '3/4', 'Verbessern der Wahrnehmungsfähigkeit: Gefühl für Raum, Zeit und Krafteinsatz'),
  z('gt', '3/4', 'Verbessern einer zweckmäßigen Körperhaltung: Kräftigung und Dehnung, Entspannung'),
  // --- LB 5 Schwimmen (Klasse 2) ---
  z('sw', '1/2', 'Erkunden und Üben vielfältiger Bewegungen im Wasser: Tauchen, Atmen, Springen ins tiefe Wasser, Gleiten, Fortbewegen'),
  z('sw', '1/2', 'Beherrschen einer ersten Schwimmtechnik (vorrangig Brustschwimmen) mit Start, Wende, Tief- und Streckentauchen'),
  z('sw', '1/2', 'Erkunden und Üben einer zweiten Schwimmtechnik (empfohlen Rückenschwimmen)'),
  z('sw', '1/2', 'Verbessern konditioneller Fähigkeiten: Schwimmstrecken verlängern'),
  z('sw', '1/2', 'Kennen der Baderegeln und der Badeordnung'),
  z('sw', '1/2', 'Anwenden vielfältiger Bewegungen im und am Wasser: Spielformen, Sprünge, Elemente der Wasserrettung'),
  // --- LB 6 Wintersport ---
  z('ws', '1/2', 'Erkunden und Üben vielfältiger Bewegungen auf Schnee und Eis: Gewöhnungsübungen, kleine Spiele'),
  z('ws', '1/2', 'Üben grundlegender skiläuferischer Fertigkeiten: Gehen, Laufen, Gleiten, Diagonalschritt, Doppelstockschub'),
  z('ws', '1/2', 'Verbessern der konditionellen und koordinativen Fähigkeiten: Laufrhythmus, Ausdauer, Skiwanderungen'),
  z('ws', '3/4', 'Anwenden skiläuferischer Fertigkeiten (alpin): Aufstiegsarten, Gleit- und Abfahrtsübungen, Pflugdrehen, Kurvenfahren'),
  z('ws', '3/4', 'Kennen von Regeln und Ritualen im Winter: umweltbewusstes Verhalten, FIS-Regeln'),
  z('ws', '3/4', 'Anwenden abwechslungsreicher Bewegungen im Winter: Spiel- und Sportformen, Konstruktionsspiele im Schnee'),
  // --- Wahlbereiche (für alle Klassenstufen) ---
  z('wb1', '1/2', 'Verbessern der Orientierungsfähigkeiten: räumliche Orientierung, Lagebeziehungen im Raum und im Gelände'),
  z('wb1', '1/2', 'Anwenden von Orientierungshilfen in der Halle und im Freien: Symbole, Lageskizzen, Ansichtsskizzen'),
  z('wb2', '1/2', 'Üben von Grundformen der Sportspiele: einfache Techniken, Komplexübungen'),
  z('wb2', '1/2', 'Anwenden von Techniken in spielerischen Übungen: Spielsituationen, Wettkampfformen'),
  z('wb3', '1/2', 'Einblick gewinnen in Aufbau und Funktion der Wirbelsäule'),
  z('wb3', '1/2', 'Anwenden rückenfreundlicher Alltagsbewegungen: Sitzen, Aufstehen, Bücken, Heben, Tragen'),
  z('wb3', '1/2', 'Anwenden funktioneller Übungen: Körperwahrnehmung, Gleichgewicht, Dehnung, Kräftigung, Mobilisation'),
  z('wb3', '1/2', 'Üben von Entspannungsformen: Massageformen, Entspannung mit Musik'),
  z('wb4', '3/4', 'Einblick gewinnen in die Bedeutung der olympischen Idee sowie der Olympischen Spiele'),
  z('wb4', '3/4', 'Üben von olympischen Disziplinen: Sommer- bzw. Wintermehrkampf, Klassen- oder Schulolympiade'),
  z('wb5', '1/2', 'Verbessern koordinativer Fähigkeiten: Gleichgewicht, Rhythmus, räumliche Orientierung, Reaktion, kinästhetische Differenzierung'),
];

// Eigene Ergänzung (kein Lehrplanbestandteil): Motorische Basistests, in jeder Klassenstufe
LERNZIELE.push(
  z('bt', '1/2', 'Verbessern der Kraftfähigkeiten'),
  z('bt', '3/4', 'Verbessern der Kraftfähigkeiten'),
);
