# Lieferant kann seine Kontrakte in der Extranet-Weboberfläche einsehen

## Kontext
Kontrakte werden im führenden ERP-System gepflegt und über die
Middleware Lobster an das Lieferanten-Extranet übertragen. Bisher haben
Lieferanten keinen Selbstbedienungs-Zugriff auf ihre eigenen Kontrakte in
der Web-Oberfläche des Extranets und müssen diese Informationen aktuell
über andere Kanäle (z. B. Sachbearbeiter, E-Mail, Papier) erhalten. Diese
Story schafft eine reine Leseansicht der Kontrakte für den eingeloggten
Lieferanten.

**Hinweis:** Kontrakt-Daten sind laut Domain-Glossar als "kommerziell"
und damit finanziell/DSGVO-sensibel eingestuft. Security und QA müssen
gezielt auf Mandantentrennung und Zugriffsschutz prüfen.

## User Story
Als Lieferant möchte ich meine Kontrakte in der Extranet-Weboberfläche
einsehen können, damit ich jederzeit selbstständig einen aktuellen
Überblick über meine vereinbarten Liefermengen und -konditionen habe,
ohne dafür Rückfragen stellen zu müssen.

## Akzeptanzkriterien

1. **Given** ein Lieferant ist erfolgreich in der Extranet-Weboberfläche
   eingeloggt, **when** er den Menüpunkt "Kontrakte" aufruft, **then**
   wird ihm eine Liste seiner eigenen Kontrakte angezeigt, die aus dem
   ERP-System über Lobster ins Extranet übertragen wurden.
2. **Given** ein Lieferant hat mehrere Kontrakte, **when** die Liste
   angezeigt wird, **then** enthält jede Zeile mindestens Kontraktnummer,
   Artikel/Warengruppe, vereinbarte Liefermenge, Gültigkeitszeitraum
   (von/bis) und Status (z. B. aktiv, abgelaufen).
3. **Given** ein Lieferant öffnet einen Kontrakt aus der Liste, **when**
   die Detailansicht geladen wird, **then** werden alle im ERP-System
   hinterlegten Kontraktkonditionen (u. a. Preis-/Mengenkonditionen) für
   genau diesen Kontrakt angezeigt.
4. **Given** ein Lieferant ist eingeloggt, **when** er auf die
   Kontrakt-Liste oder -Detailansicht zugreift, **then** werden
   ausschließlich Kontrakte angezeigt, die diesem Lieferanten
   zugeordnet sind (Mandantentrennung); ein Zugriff auf Kontrakte
   anderer Lieferanten (z. B. über direkte URL-/ID-Manipulation) wird
   serverseitig abgelehnt und mit einem Fehlerstatus (z. B. 403)
   quittiert.
5. **Given** für einen Lieferanten sind aktuell keine Kontrakte im
   Extranet vorhanden, **when** er die Kontrakt-Liste aufruft, **then**
   wird ein klarer Leer-Zustand ("Keine Kontrakte vorhanden") angezeigt
   statt einer Fehlermeldung oder eines leeren weißen Bildschirms.
6. **Given** die Synchronisation von Kontraktdaten aus dem ERP-System
   über Lobster ist fehlgeschlagen oder veraltet, **when** der Lieferant
   die Kontrakt-Liste aufruft, **then** wird ein Hinweis auf den
   Stand/Zeitpunkt der letzten erfolgreichen Datenaktualisierung
   angezeigt (kein stillschweigendes Anzeigen veralteter Daten ohne
   Kennzeichnung).
7. **Given** ein Lieferant ist nicht eingeloggt oder seine Sitzung ist
   abgelaufen, **when** er versucht, die Kontrakt-Liste oder eine
   Kontrakt-Detailansicht aufzurufen, **then** wird er zur
   Anmeldeseite weitergeleitet und es werden keine Kontraktdaten
   ausgeliefert.
8. **Given** ein Kontrakt ist abgelaufen, **when** die Liste angezeigt
   wird, **then** ist dieser Kontrakt eindeutig als "abgelaufen"
   gekennzeichnet und von aktiven Kontrakten optisch/inhaltlich
   unterscheidbar.

## Betroffene Domänenbegriffe
- Lieferant
- Kontrakt
- Lobster
- ERP-System

## Nicht-Ziele
- Kein Bearbeiten, Anlegen oder Löschen von Kontrakten durch den
  Lieferanten (reine Leseansicht).
- Keine Freigabe- oder Genehmigungsworkflows für Kontraktänderungen.
- Keine Darstellung von Kontrakten anderer Lieferanten, auch nicht für
  interne Sachbearbeiter im Rahmen dieser Story (separate interne
  Ansicht wäre eigene Story).
- Kein Export (PDF/CSV/Excel) der Kontraktliste — falls gewünscht,
  eigene Folge-Story.
- Keine Verknüpfung/Anzeige von Abnahmescheinen, Mengenmeldungen oder
  Gutschriften innerhalb der Kontraktansicht (eigenständige Belegtypen,
  eigene Stories).
- Keine mobile App-Umsetzung (Scope ist ausschließlich die
  Web-Oberfläche des Extranets).
- Keine Änderung an der Lobster-Synchronisationslogik selbst; es wird
  vorausgesetzt, dass Kontraktdaten bereits über bestehende
  Schnittstellen ins Extranet gelangen.

## Offene Fragen
- Welche Kontraktattribute aus dem ERP-System gelten als
  freigegeben/erforderlich für die Anzeige im Extranet (vollständiger
  Feldkatalog), und gibt es Felder, die aus Vertraulichkeitsgründen
  bewusst NICHT angezeigt werden dürfen?
- Wie ist der Umgang mit historischen/abgelaufenen Kontrakten geregelt —
  werden diese zeitlich unbegrenzt angezeigt oder nach einer definierten
  Frist ausgeblendet/archiviert?
- Wie wird die Mandantentrennung technisch abgesichert (z. B.
  Autorisierung pro Kontrakt-ID serverseitig vs. rein
  UI-seitige Filterung)? Bedarf Klärung mit Architect/Security.
- Wie aktuell müssen die Kontraktdaten sein (Synchronisationsintervall
  über Lobster), und wie wird dem Lieferanten der Datenstand
  kommuniziert?
- Gibt es rechtliche/vertragliche Vorgaben (z. B. aus
  Lieferantenverträgen), die eine Einsicht bestimmter Kontraktdetails
  im Extranet einschränken?
- Wird für diese Story ein Audit-Log für Lesezugriffe auf Kontrakte
  benötigt (Compliance-Anforderung), analog zu anderen sensiblen
  Datentypen im Glossar?
- Sollen Sachbearbeiter im Rahmen dieser Story bereits eine
  eingeschränkte "Anzeigen als Lieferant"-Funktion erhalten, oder ist
  das explizit außerhalb des Scopes (siehe Nicht-Ziele)?
