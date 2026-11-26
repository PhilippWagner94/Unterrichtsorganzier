// Startsammlung: bekannte Bewegungsspiele und methodische Reihen, in eigenen Worten kurz beschrieben.
// Alle Einträge sind frei änderbar. Das Quellenfeld bleibt leer (eigene Literaturverweise kannst du ergänzen).

import type { Ort, ReihenSchritt } from '../db/types';

export interface SpielStart {
  titel: string;
  beschreibung: string;
  dauerMin: number;
  gruppeMin: number;
  gruppeMax: number;
  material: string;
  ort: Ort;
  ziele: string[];
}

const sp = (
  titel: string,
  beschreibung: string,
  dauerMin: number,
  gruppeMin: number,
  gruppeMax: number,
  material: string,
  ort: Ort,
  ziele: string[],
): SpielStart => ({ titel, beschreibung, dauerMin, gruppeMin, gruppeMax, material, ort, ziele });

export const SPIELE_START: SpielStart[] = [
  sp('Fischer, Fischer', 'Ein Kind ist Fischer und steht in der Mitte, alle anderen starten an einer Seite. Nach der Frage zur Wassertiefe rennen alle auf die andere Seite, ohne gefangen zu werden. Wer gefangen ist, hilft ab jetzt beim Fangen.', 10, 10, 30, 'keins', 'beides', ['Fangspiel', 'Aufwärmen', 'Schnelligkeit']),
  sp('Schwarzer Mann', 'Der Fänger steht in der Mitte, die anderen laufen von einer Seite zur anderen. Wer berührt wird, wird selbst zum Fänger. Zum Schluss bleiben die schnellsten Kinder übrig.', 10, 10, 30, 'keins', 'beides', ['Fangspiel', 'Aufwärmen']),
  sp('Kettenfangen', 'Ein Fänger beginnt. Wer berührt wird, fasst die Hand des Fängers, so entsteht eine Kette, die gemeinsam weiterfängt. Nur die Enden der Kette dürfen fangen.', 10, 8, 30, 'keins', 'beides', ['Fangspiel', 'Kooperation']),
  sp('Tunnelfangen', 'Gefangene stellen sich mit gegrätschten Beinen hin. Befreit werden sie, wenn ein anderes Kind durch den Tunnel krabbelt. So kommt immer wieder Bewegung ins Spiel.', 10, 8, 30, 'keins', 'beides', ['Fangspiel', 'Kooperation']),
  sp('Feuer, Wasser, Blitz', 'Die Kinder laufen frei durch den Raum. Auf jedes Kommando gehört eine feste Bewegung, zum Beispiel auf eine Bank steigen, auf den Boden legen oder in der Hocke bleiben. Wer zuletzt reagiert, scheidet nicht aus, sondern macht eine kleine Zusatzübung.', 8, 8, 30, 'Bänke oder Matten', 'halle', ['Reaktion', 'Aufwärmen', 'Zuhören']),
  sp('Ampelspiel', 'Bei Grün laufen die Kinder, bei Gelb gehen sie langsam, bei Rot bleiben sie stehen. Mit Zusatzaufgaben (Hüpfen, Rückwärtslaufen) wird es schwerer.', 6, 6, 30, 'drei farbige Karten', 'beides', ['Aufwärmen', 'Reaktion', 'Klasse 1/2']),
  sp('Reise nach Jerusalem mit Reifen', 'Es liegen ein Reifen weniger als Kinder im Raum. Zur Musik wird gelaufen, bei Stopp muss jedes Kind in einen Reifen. Ein Kind darf bei der Gruppe weiter mitmachen und hilft beim Zählen oder Auslegen.', 10, 8, 24, 'Reifen, Musik', 'halle', ['Reaktion', 'Spaß']),
  sp('Zeitungsinsel', 'Jedes Paar steht auf einem Blatt Zeitung. Nach jeder Runde wird das Blatt halbiert. Wer nicht mehr passt, geht in ein anderes Team, bis alle gemeinsam auf wenig Platz stehen.', 10, 8, 24, 'Zeitungspapier', 'halle', ['Kooperation', 'Gleichgewicht']),
  sp('Pendelstaffel', 'Zwei Mannschaften stehen sich gegenüber. Jedes Kind läuft zur anderen Seite und schlägt das nächste ab. Gewonnen hat das Team, bei dem alle zuerst wieder an ihrem Platz stehen.', 10, 8, 30, 'Hütchen', 'beides', ['Staffel', 'Schnelligkeit']),
  sp('Ballstaffel durch die Beine', 'Die Kinder stehen hintereinander und geben einen Ball abwechselnd über den Kopf und durch die Beine nach hinten. Das letzte Kind rennt nach vorn und es geht weiter.', 10, 8, 30, 'Bälle', 'beides', ['Staffel', 'Ballgewöhnung', 'Kooperation']),
  sp('Burgball', 'Jedes Team verteidigt eine Burg aus Kegeln. Mit weichen Bällen versuchen beide Teams, die gegnerische Burg zu treffen. Die Abwehr darf mit dem Körper blocken, aber den Ball nicht festhalten.', 15, 10, 24, 'Kegel, weiche Bälle', 'halle', ['Ballspiel', 'Werfen', 'Taktik']),
  sp('Zweifelderball', 'Zwei Mannschaften stehen in getrennten Feldern. Wer vom Ball getroffen wird, wechselt hinter das gegnerische Feld und spielt von dort weiter. Mit weichen Bällen und der Regel „nur ab Hüfte abwärts“ wird es fair.', 15, 10, 30, 'weiche Bälle, Mittellinie', 'halle', ['Ballspiel', 'Werfen', 'Fangen']),
  sp('Ball über die Schnur', 'Zwei Teams spielen über eine Schnur in Kopfhöhe der Kinder. Der Ball darf gefangen und mit beiden Händen zurückgeworfen werden. Fällt er im Feld auf den Boden, gibt es einen Punkt.', 15, 8, 20, 'Schnur, Ball', 'halle', ['Ballspiel', 'Fangen', 'Werfen']),
  sp('Mein rechter Platz ist leer', 'Die Kinder sitzen im Kreis, ein Platz bleibt frei. Das Kind neben dem freien Platz ruft ein anderes Kind herbei, das nun zum freien Platz laufen muss. So wandert die Lücke durch den Kreis.', 8, 8, 24, 'Stühle oder Matten', 'halle', ['Kennenlernen', 'Ruhe', 'Reaktion']),
  sp('Statuentanz', 'Zur Musik tanzen die Kinder frei. Stoppt die Musik, erstarrt jeder zur Statue. Wer sich bewegt, muss kurz an den Rand. Der Tanz kann auch mit Vorgaben (hoch, tief, langsam) variiert werden.', 8, 8, 30, 'Musik', 'halle', ['Rhythmus', 'Gleichgewicht', 'Körperspannung']),
  sp('Schatzsuche im Parcours', 'In Kleingruppen müssen die Kinder einen Weg über Bänke, Matten und Kästen bewältigen, um an versteckte „Schätze“ (kleine Bälle) zu kommen. Die ganze Gruppe muss gemeinsam ankommen.', 20, 8, 28, 'Bänke, Matten, Kästen, Bälle', 'halle', ['Kooperation', 'Klettern', 'Balancieren']),
  sp('Gordischer Knoten', 'Alle stehen im engen Kreis und fassen mit geschlossenen Augen zwei Hände. Danach wird versucht, ohne loszulassen den Knoten wieder zu entwirren.', 10, 8, 14, 'keins', 'beides', ['Kooperation', 'Kommunikation']),
  sp('Blindenführer', 'Immer zwei Kinder gehen zusammen: Eines hat die Augen geschlossen und wird sicher geführt, zuerst mit Handkontakt, später nur mit Worten. Dann wird getauscht.', 10, 6, 30, 'optional Augenbinden', 'beides', ['Vertrauen', 'Wahrnehmung', 'Kooperation']),
  sp('Dosenwerfen', 'Aus einer Wurflinie versuchen die Kinder, aufgestellte Dosen oder Kegel mit weichen Bällen oder Säckchen zu treffen. Der Abstand kann je nach Klasse verändert werden.', 15, 6, 30, 'Dosen, Säckchen, Bälle', 'beides', ['Werfen', 'Zielgenauigkeit']),
  sp('Nummernlauf', 'Jedes Kind einer Mannschaft hat eine Nummer. Wird eine Nummer aufgerufen, rennen alle Kinder mit dieser Nummer um die Wette um ein Hindernis und zurück. Mit wechselnden Fortbewegungsarten (Hüpfen, Krebsgang).', 10, 8, 30, 'Hütchen', 'beides', ['Schnelligkeit', 'Reaktion']),
  sp('Tauziehen', 'Zwei gleich starke Mannschaften ziehen an einem Tau. Wer die Mittelmarke über die eigene Linie zieht, gewinnt. Auf gleichmäßiges Ziehen achten, nicht ruckartig.', 10, 8, 24, 'langes Tau', 'beides', ['Kraft', 'Kooperation']),
  sp('Schattenlaufen', 'Immer zwei Kinder: Eines bewegt sich frei durch den Raum, das andere folgt wie ein Schatten und macht alles nach. Nach einer Minute wird getauscht.', 8, 6, 30, 'keins', 'beides', ['Aufwärmen', 'Wahrnehmung', 'Koordination']),
  sp('Igelball-Massage', 'Zu ruhiger Musik massiert ein Kind mit einem Igelball den Rücken des Partners. Es wird vorher abgesprochen, wie fest. Danach wird gewechselt.', 10, 6, 30, 'Igelbälle, ruhige Musik', 'halle', ['Entspannung', 'Ruhe']),
  sp('Seilspring-Challenge', 'Jedes Kind übt am eigenen Seil verschiedene Sprünge. Wer ein Kunststück schafft, zeigt es einem Partner. Ziel ist, in Kleingruppen eine kurze Sprungfolge zu gestalten.', 15, 6, 30, 'Seile', 'beides', ['Rope Skipping', 'Rhythmus', 'Koordination']),
  sp('Zielwerfen auf Matten', 'Auf Matten oder Kästen werden Zielflächen markiert. Die Kinder werfen kleine Bälle aus verschiedenen Abständen und sammeln Punkte.', 12, 6, 30, 'Matten, kleine Bälle, Kreide', 'halle', ['Werfen', 'Zielgenauigkeit', 'Zählen']),
  sp('Hase und Jäger', 'Ein Kind ist Jäger, die anderen sind Hasen und laufen in einem begrenzten Feld. Wer berührt wird, setzt sich kurz hin und wird frei, wenn ein anderer Hase ihn abklatscht.', 10, 8, 30, 'keins', 'beides', ['Fangspiel', 'Aufwärmen', 'Kooperation']),
];

export interface ReiheStart {
  thema: string;
  lernbereichKey: string; // Schlüssel wie in data/lehrplanSport.ts
  schritte: ReihenSchritt[];
  sicherheit: string;
}

const st = (titel: string, beschreibung: string): ReihenSchritt => ({ titel, beschreibung });

export const REIHEN_START: ReiheStart[] = [
  {
    thema: 'Rolle vorwärts',
    lernbereichKey: 'tu',
    schritte: [
      st('Gewöhnung', 'Auf der Matte schaukeln und rollen: Igel, Wiege, Schaukel auf dem runden Rücken.'),
      st('Ausgangsstellung', 'Hocke, Hände schulterbreit auf die Matte, Kinn zur Brust, Po hoch.'),
      st('Schiefe Ebene', 'Rolle über einen Keil oder eine schräge Mattenbahn, die den Schwung erleichtert.'),
      st('Rolle mit Abdruck', 'Aus der Hocke abdrücken, über den runden Rücken abrollen und in die Hocke zurückkommen.'),
      st('Aufstehen ohne Hände', 'Mit Schwung und Armen nach vorn in den Stand kommen.'),
      st('Verbindungen', 'Zwei Rollen hintereinander oder Rolle mit Sprung am Ende.'),
    ],
    sicherheit: 'Weiche Matten, genug Abstand zwischen den Bahnen. Kinn auf die Brust, Kopf nie auf die Matte aufsetzen. Kinder nicht zum Rollen zwingen, bei Beschwerden im Nacken pausieren. Bei Bedarf Hilfestellung am Rücken und an der Hüfte.',
  },
  {
    thema: 'Rolle rückwärts',
    lernbereichKey: 'tu',
    schritte: [
      st('Rückwärtsschaukeln', 'Aus der Hocke auf den Rücken rollen und wieder hochschaukeln.'),
      st('Hände richtig platzieren', 'Hände neben den Ohren, Handflächen nach oben, Ellenbogen zeigen nach vorn.'),
      st('Schiefe Ebene abwärts', 'Rolle rückwärts über einen Keil, damit der Weg über den Kopf leichter wird.'),
      st('Abdrücken mit den Händen', 'Beim Überrollen kräftig mit den Händen abdrücken, um den Kopf zu entlasten.'),
      st('Landung in der Hocke', 'In die Hocke kommen und aufstehen, später mit gestreckten Beinen.'),
    ],
    sicherheit: 'Kopf darf nicht belastet werden: Wenn die Kinder nicht über die Matte rollen, Keil oder Hilfestellung nutzen. Immer zwei Matten und Platz hinter den Kindern lassen. Kein Zwang, nicht wiederholt bei Schmerzen.',
  },
  {
    thema: 'Aufhocken auf den Kasten',
    lernbereichKey: 'tu',
    schritte: [
      st('Absprung üben', 'Beidbeiniger Absprung vom Minitramp oder Sprungbrett, Landung auf der Matte.'),
      st('Aufsprung', 'Aus dem Stand auf einen niedrigen Kasten springen und ruhig stehen.'),
      st('Aufhocken', 'Aus kurzem Anlauf mit beidbeinigem Absprung in die Hocke auf den Kasten, Hände stützen.'),
      st('Abgang', 'Strecksprung oder Niedersprung mit Landung auf beiden Füßen, leicht in die Knie.'),
      st('Höhe steigern', 'Kastenhöhe langsam erhöhen, nur wenn die Landung sicher ist.'),
    ],
    sicherheit: 'Weichbodenmatte vor dem Kasten, stabiler Kastenaufbau. Anlauf nur wenn der vorherige Schüler frei ist. Hilfestellung am Oberarm auf Wunsch.',
  },
  {
    thema: 'Sprunggrätsche über Kasten oder Bock',
    lernbereichKey: 'tu',
    schritte: [
      st('Stütz am Gerät', 'Mit beiden Händen auf den Kasten stützen, Beine seitlich spreizen (Bocksprung am Stand).'),
      st('Absprung vom Brett', 'Beidbeiniger Absprung vom Sprungbrett mit Aufsetzen der Hände auf dem niedrigen Gerät.'),
      st('Grätschen', 'Aus dem Absprung die Beine seitlich öffnen und über das Gerät führen.'),
      st('Landung', 'Mit leichten Knien auf der Matte landen, Arme zur Balance.'),
      st('Anlauf und Höhe', 'Mit Anlauf und höherem Gerät steigern, auf sicheres Aufstützen achten.'),
    ],
    sicherheit: 'Gerät niedrig beginnen, Matte hinter dem Gerät, Sprungbrett fest. Bei Hilfestellung seitlich am Gerät stehen, nicht davor. Kinder, die nicht sicher stützen, mit einem niedrigeren Gerät üben lassen.',
  },
  {
    thema: 'Klettern an Stange und Tau',
    lernbereichKey: 'tu',
    schritte: [
      st('Hängen', 'An Reck oder Sprossenwand hängen und Gewicht spüren, Beine anziehen.'),
      st('Greifen und Umgreifen', 'Mit wechselnden Händen die Stange hochgreifen, Beine abwechselnd klemmen.'),
      st('Klemmgriff mit den Füßen', 'Mit den Füßen die Stange klemmen und mit Armen und Beinen nach oben schieben.'),
      st('Absteigen', 'Kontrolliert herunterklettern, nicht herabrutschen oder fallen lassen.'),
      st('Höhe steigern', 'Immer eine Mattenfläche darunter, Höhe schrittweise erhöhen.'),
    ],
    sicherheit: 'Matte unter dem Gerät, nie über Kopfhöhe ohne sichere Technik. Kein Wetteifern in der Höhe. Hände vor dem Klettern prüfen (kein Schweiß, keine Handschuhe). Lange Haare zusammenbinden, Schmuck ablegen.',
  },
  {
    thema: 'Weitsprung',
    lernbereichKey: 'la',
    schritte: [
      st('Beidbeiniges Weitspringen', 'Aus dem Stand möglichst weit springen, Landung auf beiden Füßen.'),
      st('Absprung aus dem Anlauf', 'Mit kurzem Anlauf in eine markierte Zone springen, Schwungbein hochziehen.'),
      st('Flugphase', 'Arme und Beine zu einer stabilen Flugposition führen, Fußspitzen heben.'),
      st('Landung', 'Mit den Füßen voran in die Grube oder Matte, Knie beugen und nach vorn fallen.'),
      st('Anlauf verlängern', 'Anlauf Schritt für Schritt verlängern, Anlaufmarkierung festlegen.'),
    ],
    sicherheit: 'Sprunggrube auflockern und von Steinen befreien, Mattenränder sichern. Absprungzone nutzen statt eines schmalen Balkens. Immer nur ein Kind im Anlauf.',
  },
  {
    thema: 'Hochsprung (Schersprung)',
    lernbereichKey: 'la',
    schritte: [
      st('Gummiband ohne Anlauf', 'Hüpfen und Steigen über ein niedriges Gummiband in verschiedenen Formen.'),
      st('Schrägangang', 'Seitlicher Anlauf, mit dem Schwungbein über die Latte schwingen.'),
      st('Absprung', 'Mit dem äußeren Bein kräftig abspringen, Knie des Schwungbeins hoch.'),
      st('Landung', 'Auf dem Schwungbein landen und abrollen oder auf der Matte ablegen.'),
      st('Höhe steigern', 'Gummiband oder Latte langsam anheben.'),
    ],
    sicherheit: 'Weiche Hochsprungmatte, Latte oder Gummiband, das leicht herunterfällt. Abstand zur Matte wahren. Immer nur ein Kind im Anlauf.',
  },
  {
    thema: 'Schlagwurf',
    lernbereichKey: 'la',
    schritte: [
      st('Werfen im Stand', 'Mit dem Schlagball zielen und den Ball über eine Linie werfen.'),
      st('Wurfauslage', 'Gegengleiche Stellung: Wurfarm hinten, Gegenarm vorn, Gewicht auf dem hinteren Bein.'),
      st('Wurfbewegung', 'Aus der Auslage den Arm über Kopf nach vorn führen, den Ball im Lauf des Wurfs loslassen.'),
      st('Kurzer Anlauf', 'Mit zwei bis drei Schritten Anlauf, Rumpf nach vorn drehen.'),
      st('Zielwerfen', 'Auf markierte Zonen oder Kegel werfen und Weiten messen.'),
    ],
    sicherheit: 'Es wird nur auf Kommando geworfen, alle Kinder in dieselbe Richtung. Wurfraum frei halten und nach dem Wurf gemeinsam Bälle holen. Weiche Bälle für Anfänger.',
  },
  {
    thema: 'Handstand und Kopfstand (Vorübungen)',
    lernbereichKey: 'tu',
    schritte: [
      st('Körperspannung', 'Auf dem Boden Rumpfspannung üben: Brett, Käfer, Hohlkreuz vermeiden.'),
      st('Stütz am Boden', 'Im Vierfüßlerstand Gewicht auf die Hände verlagern, Arme gestreckt lassen.'),
      st('Kopfstand-Dreieck', 'Hände und Kopf bilden ein Dreieck, Knie auf die Ellenbogen legen, kurz anheben.'),
      st('Handstand an der Wand', 'Mit dem Bauch zur Wand hochgehen, Füße an der Wand, Rücken gerade halten.'),
      st('Hilfe durch Partner', 'Mit Hilfe des Partners den Handstand kurz halten und kontrolliert absteigen.'),
    ],
    sicherheit: 'Immer mit Matte und Partner arbeiten. Beim Kopfstand nur das Dreieck belasten, den Nacken nicht überstrecken. Nicht auf Zwang, wer sich nicht traut, übt Vorstufen.',
  },
];
