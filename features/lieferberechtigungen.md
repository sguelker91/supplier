Kontext

Analysiere den Screenshot Design/Lieferberechtigungen.png.

Der Screenshot stammt aus dem bestehenden Lieferantenportal.

Er dient ausschließlich als fachliche Referenz.

Das UI, Layout und Design dürfen nicht übernommen werden.

Die neue Oberfläche muss entsprechend den Vorgaben aus DESIGN.md und APP.png umgesetzt werden.

Aufgabe

Implementiere die Funktion "Lieferberechtigungen anzeigen".

Vor der Implementierung analysiere zunächst den Screenshot und leite daraus die fachlichen Anforderungen ab.

Falls Informationen fehlen oder mehrdeutig sind, dokumentiere deine Annahmen.

Fachliche Beschreibung

Ein Lieferant kann seine aktuellen Lieferberechtigungen einsehen.

Die Liste kann über einen Datumsbereich eingeschränkt werden.

Jede Lieferberechtigung besitzt mindestens folgende Informationen:

Abrufnummer
Lieferdatum
Uhrzeit
Sorte

Jeder Eintrag kann geöffnet werden.

Mehrere Lieferberechtigungen können markiert werden.

Markierte Lieferberechtigungen können gemeinsam geöffnet werden.

Akzeptanzkriterien
Anzeige
Es existiert eine Seite "Lieferberechtigungen".
Die Seite verwendet das neue Design.
Die Seite ist vollständig responsive.
Die Navigation entspricht dem neuen Portal.
Filter
Der Benutzer kann einen Zeitraum auswählen.
Änderungen des Zeitraums aktualisieren die Liste.
Standardmäßig wird ein sinnvoller Zeitraum angezeigt.
Tabelle

Die Tabelle enthält mindestens folgende Spalten:

Abrufnummer
Lieferdatum
Uhrzeit
Sorte

Jede Zeile besitzt:

Auswahlmöglichkeit
Aktion "Öffnen"
Mehrfachauswahl
Mehrere Lieferberechtigungen können markiert werden.
"Alle markieren" funktioniert.
Die Auswahl bleibt erhalten, bis sie geändert wird.
Aktionen
Einzelne Lieferberechtigungen können geöffnet werden.
Mehrere markierte Lieferberechtigungen können gemeinsam geöffnet werden.
UX
Ladezustände werden angezeigt.
Leere Ergebnisse werden benutzerfreundlich dargestellt.
Fehler werden verständlich angezeigt.
Architektur
Komponenten sollen wiederverwendbar sein.
Tabellen dürfen nicht speziell für dieses Feature entwickelt werden.
Filter sollen generisch aufgebaut sein.
Styling erfolgt ausschließlich über das neue Designsystem.
Tests

Implementiere Unit-Tests und Integrationstests für:

Datumsfilter
Mehrfachauswahl
"Alle markieren"
Öffnen einer Lieferberechtigung
Öffnen mehrerer Lieferberechtigungen

Fachliche Beschreibung

Datenquelle

Die Lieferberechtigungen werden nicht lokal verwaltet.

Alle fachlichen Daten stammen aus dem ERP-System.

Die Anwendung dient ausschließlich als Benutzeroberfläche für diese Daten.

Die konkrete ERP-Anbindung wird über Backend-Services abstrahiert.

Dokumente

Zu einer Lieferberechtigung können Dokumente existieren.

Diese Dokumente werden nicht im ERP gespeichert.

Die Dokumente werden zukünftig über eine API aus der D3 Cloud geladen.

Die Implementierung soll deshalb so erfolgen, dass die Dokumentenanzeige über eine Service-Schnittstelle erfolgt und die konkrete API später problemlos integriert werden kann.
