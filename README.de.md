# ioBroker IEC 60870-5-104 Adapter

Der Adapter verbindet ioBroker mit IEC 60870-5-104. Er kann als Master/Leitstelle oder als Slave/Unterstation betrieben werden und bildet IEC-104-Informationsobjekte auf ioBroker-States ab.

## Funktionen

- Master-Modus als IEC-104-Leitstelle.
- Slave-Modus als IEC-104-Unterstation.
- TCP-Kommunikation ueber Port 2404 oder frei waehlbare Ports.
- STARTDT, STOPDT, TESTFR sowie I-, S- und U-Frames.
- Generalabfrage `C_IC_NA_1` nach Verbindungsaufbau, manuell oder zyklisch.
- Konfigurierbare Datenpunkttabelle mit Name, IOA, optionaler ASDU/Common Address, Typ, State-ID, Einheit, Faktor und Offset.
- Automatische Anlage unbekannter IOAs im Master-Modus.
- Objektstruktur nach ASDU/Common Address.
- Separate States fuer Wert, IV, NT, Zeitstempel und COT.
- Befehls-ASDUs im Master-Modus.
- Spontane Meldungen im Slave-Modus bei geaenderten ioBroker-States.
- Verbesserter Reconnect im Master-Modus, auch wenn die Gegenstelle waehrend oder vor dem IEC-104-Handshake wegfaellt.
- TSV-Import und TSV-Export der Datenpunkttabelle.

## Installation

Lokales Paket installieren:

```bash
iobroker url /path/to/iobroker.iec104-0.1.17.tgz
iobroker add iec104
```

Nach der Installation die Instanz oeffnen, Datenpunkte und Verbindungsparameter pruefen und erst danach `Kommunikation aktivieren` einschalten.

## Betriebsarten

### Master / Leitstelle

Im Master-Modus baut der Adapter eine TCP-Verbindung zur IEC-104-Unterstation auf. Nach STARTDT kann automatisch eine Generalabfrage gesendet werden. Empfangene Mess- und Meldedaten werden in ioBroker geschrieben.

Wenn eine unbekannte IOA empfangen wird, legt der Adapter sie automatisch an und speichert sie gebuendelt in der Adapterkonfiguration. Die automatische Persistierung wird verzoegert, damit eine laufende Generalabfrage nicht durch einen Instanzneustart unterbrochen wird.

Wenn die Verbindung abbricht oder schon vor dem vollstaendigen IEC-104-Handshake scheitert, plant der Adapter automatisch einen neuen Verbindungsaufbau nach `Reconnect delay`.

### Slave / Unterstation

Im Slave-Modus wartet der Adapter auf eine eingehende Leitstellenverbindung. Bei Generalabfrage sendet er alle aktivierten Datenpunkte mit `interrogated by station (20)`. Wenn ein konfigurierter ioBroker-State geaendert wird, sendet der Adapter eine spontane Meldung mit `spontaneous (3)`.

Es wird nur eine aktive IEC-104-Client-Verbindung gleichzeitig akzeptiert.

## Objektstruktur

Ab Version 0.1.17 werden interne States nach ASDU/Common Address gruppiert:

```text
iec104.0.ASDU-<ASDU>.Value-Points.<IOA>
iec104.0.ASDU-<ASDU>.IV-Points.<IOA>
iec104.0.ASDU-<ASDU>.NT-Points.<IOA>
iec104.0.ASDU-<ASDU>.Time-Points.<IOA>
iec104.0.ASDU-<ASDU>.COT-Points.<IOA>
```

Beispiel fuer ASDU 1 und IOA 260610:

```text
iec104.0.ASDU-1.Value-Points.260610
iec104.0.ASDU-1.IV-Points.260610
iec104.0.ASDU-1.NT-Points.260610
iec104.0.ASDU-1.Time-Points.260610
iec104.0.ASDU-1.COT-Points.260610
```

### Value-Points

`Value-Points` enthaelt den dekodierten Nutzwert. Das ist der bisherige `points`-Wert, nur mit neuem Namen und unterhalb der ASDU.

Wenn in der Datenpunkttabelle `ioBroker-State` leer ist oder noch `points.<IOA>` enthaelt, nutzt der Adapter automatisch den neuen internen Pfad `ASDU-<ASDU>.Value-Points.<IOA>`.

Vollstaendige externe State-IDs, zum Beispiel `modbus.0.holdingRegisters.40001`, bleiben unveraendert.

### IV-Points

`IV-Points` zeigt das IEC-104-Qualitybit `IV`:

- `false`: Der Wert ist laut IEC-Quality gueltig.
- `true`: `IV` ist gesetzt, der Wert ist invalid.

Das Bit wird aus dem Quality-Byte der unterstuetzten Melde- und Messwerttypen gelesen.

### NT-Points

`NT-Points` zeigt das IEC-104-Qualitybit `NT` (`not topical` / nicht aktuell):

- `false`: Der Wert ist nicht als `not topical` markiert.
- `true`: `NT` ist gesetzt, der Wert ist nicht aktuell.

Das Bit wird direkt aus dem IEC-104-Quality-Byte gelesen. Es wird fuer dieselben Typen ausgewertet wie `IV`, also fuer alle unterstuetzten Monitoring-Typen mit Quality-Byte.

### Time-Points

`Time-Points` enthaelt den letzten Zeitbezug als ISO-Zeit:

- Bei CP56-Typen wird der vollstaendige IEC-Zeitstempel verwendet.
- Bei CP24-Typen werden Minute, Sekunde und Millisekunde aus IEC genommen und mit Datum/Stunde des Empfangs ergaenzt.
- Bei Typen ohne IEC-Zeitstempel wird der lokale Empfangszeitpunkt gespeichert.

### COT-Points

`COT-Points` enthaelt die letzte Uebertragungsursache als englischen Klartext inklusive Nummer, zum Beispiel:

```text
spontaneous (3)
interrogated by station (20)
activation confirmation (7)
unknown common address of ASDU (46)
```

Damit ist sichtbar, ob der letzte Wert spontan, aus einer Generalabfrage, als Aktivierungsbestaetigung oder aus einem Fehlergrund kam.

## Datenpunkttabelle

| Spalte | Bedeutung |
| --- | --- |
| Aktiv | Datenpunkt wird verwendet. |
| Name | Anzeigename des ioBroker-States. |
| IOA | Information Object Address. |
| ASDU | Optionale Common Address fuer diesen Punkt. Leer nutzt die Stationsadresse der Instanz. |
| Typ | IEC-104-Typ, z. B. `M_ME_NC_1` oder `M_SP_NA_1`. |
| ioBroker-State | Interner oder externer State. Leer bedeutet neuer interner `ASDU-<ASDU>.Value-Points.<IOA>`-Pfad. |
| Schreibbar | Erlaubt eingehende Befehle im Slave-Modus. |
| Einheit | Einheit im ioBroker-Objekt. |
| Faktor | Skaliert empfangene Rohwerte: `value = raw * factor + offset`. |
| Offset | Offset fuer die Skalierung. |

TSV-Spalten:

```text
enabled	name	ioa	commonAddress	type	stateId	writable	unit	factor	offset
```

## Schreiben und Befehle

Im Master-Modus werden unbestaetigte Aenderungen (`ack=false`) an konfigurierten Datenpunkt-States als IEC-104-Befehl gesendet. Der Adapter waehlt fuer Mess- und Meldetypen den passenden Befehlstyp, zum Beispiel `M_SP_*` zu `C_SC_NA_1` oder `M_ME_NC_*` zu `C_SE_NC_1`.

Im Slave-Modus werden eingehende Befehle nur ausgefuehrt, wenn `Nur lesen` deaktiviert ist und der Datenpunkt als `Schreibbar` markiert ist.

## Troubleshooting

Keine Verbindung:

- IP-Adresse, Port und Firewall pruefen.
- Im Slave-Modus pruefen, ob der Port auf dem ioBroker-Host frei ist.
- `Reconnect delay` pruefen. Der Master verbindet nach Abbruch automatisch neu.
- Log-Level auf `debug` stellen, wenn der IEC-104-Handshake analysiert werden soll.

Verbindung steht, aber keine Werte:

- Common Address, COT-Laenge, Common-Address-Laenge und IOA-Laenge pruefen.
- Generalabfrage manuell ueber `commands.general_interrogation` ausloesen.
- Datenpunkttypen mit der Gegenstelle abgleichen.
- In `COT-Points` pruefen, welche Uebertragungsursache zuletzt empfangen wurde.
- In `IV-Points` und `NT-Points` pruefen, ob die Gegenstelle Werte als invalid oder not topical markiert.

Spontane Aenderungen kommen nicht an:

- Pruefen, ob die Gegenstelle wirklich ASDUs mit COT `spontaneous (3)` sendet.
- Log-Level auf `debug` stellen und nach `IEC-104 ASDU rx` suchen.
- IOA-Laenge und Common Address pruefen. Falsche Laengen verschieben die Dekodierung.

Befehle werden nicht ausgefuehrt:

- Im Slave-Modus `Nur lesen` deaktivieren.
- Datenpunkt als `Schreibbar` markieren.
- Pruefen, ob der State mit `ack=false` geschrieben wurde.

## Changelog

### 0.1.17

- Ordnet States nach ASDU mit Value/IV/NT/Time/COT-Ordnern.
- Stellt NT-Quality und COT-Klartext bereit.
- Verbessert den Master-Reconnect.

### 0.1.16

- Buendelt das Speichern entdeckter Datenpunkte.
- Verhindert Neustarts waehrend der Generalabfrage.
- Wiederholt bei `UNKNOWN_CA` mit erkannter Common Address.

### 0.1.15

- Ergaenzt Time-Points-States mit IEC-104-CP24/CP56-Zeitstempeln.
- Nutzt die Empfangszeit als Fallback.

### 0.1.14

- Erweitert die IV-Quality-Auswertung auf alle unterstuetzten IEC-104-Meldetypen mit Quality-Bits.

### 0.1.13

- Stellt das IEC-104-IV-Quality-Bit als separate IV-Points-States je Datenpunkt bereit.

### 0.1.12

- Deklariert Windows-Unterstuetzung.
- Legt den npm-Paketinhalt explizit fest.

### 0.1.11

- Stellt normale IEC-104-Betriebsdiagnosen von Info- auf Debug-Logging um.

### 0.1.10

- Merkt empfangene Common Addresses je IOA.
- Nutzt die gemerkten Common Addresses fuer Master-Befehle.

### 0.1.9

- Protokolliert Master-Befehlsbestaetigungen.
- Quittiert States nach Aktivierungsbestaetigung.

### 0.1.8

- Ergaenzt Diagnosemeldungen fuer Master-Schreibbefehle.
- Ergaenzt Diagnosemeldungen fuer abonnierte Datenpunkte.

### 0.1.7

- Sendet IEC-104-Befehls-ASDUs, wenn Datenpunkte im Master geaendert werden.

### 0.1.6

- Uebernimmt automatisch gefundene Master-Datenpunkte in die Adapter-Einstellungstabelle.

### 0.1.5

- Verwendet native Tabellen-Import- und Export-Schaltflaechen fuer die Datenpunktkonfiguration.

### 0.1.4

- Fuegt TSV-Import und TSV-Export fuer die Datenpunktkonfiguration hinzu.

### 0.1.3

- Sendet konfigurierte Befehls-Datenpunkte in Slave-Antworten als passende Melde-ASDUs.

### 0.1.2

- Aktualisiert generierte Datenpunkt-Objekte bei Konfigurationsaenderungen.

### 0.1.1

- Ergaenzt die vollstaendige IEC-104-Typauswahl mit Typnummern.
- Erweitert den Parser-Support.

### 0.1.0

- Erste IEC 60870-5-104 Adapterversion mit Master- und Slave-Modus.
