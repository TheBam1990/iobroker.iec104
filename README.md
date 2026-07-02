# ioBroker IEC 60870-5-104 Adapter

Adapter für die IEC-60870-5-104-Kommunikation in ioBroker. Der Adapter kann als Master/Leitstelle oder als Slave/Unterstation betrieben werden und bildet IEC-104-Informationsobjekte auf ioBroker-States ab.

## Funktionen

- Master-Modus als IEC-104-Leitstelle.
- Slave-Modus als IEC-104-Unterstation.
- TCP-Kommunikation über den IEC-104-Standardport 2404 oder frei wählbare Ports.
- STARTDT, STOPDT und TESTFR.
- I-, S- und U-Frames mit Sequenznummern.
- Generalabfrage `C_IC_NA_1` nach Verbindungsaufbau, manuell oder zyklisch.
- Konfigurierbare Datenpunkttabelle mit IOA, Typ, State-ID, Einheit, Faktor und Offset.
- Automatische Anlage unbekannter IOAs im Master-Modus, wenn neue Werte empfangen werden.
- Schreiben von Befehls-ASDUs im Master-Modus, wenn konfigurierte ioBroker-States geändert werden.
- Senden spontaner Werte im Slave-Modus, wenn konfigurierte ioBroker-States geändert werden.
- TSV-Import und TSV-Export der Datenpunkttabelle über die Admin-Oberfläche.
- Deutsch/englische Admin-Oberfläche.
- Läuft unter Linux, Windows und macOS.

## Voraussetzungen

- ioBroker js-controller >= 5.0.0
- ioBroker Admin >= 6.0.0
- Node.js >= 18
- Netzwerkzugriff zwischen ioBroker-Host und IEC-104-Gegenstelle

## Installation

Lokales Testpaket installieren:

```bash
iobroker url /path/to/iobroker.iec104-0.1.12.tgz
iobroker add iec104
```

Unter Windows zum Beispiel:

```powershell
iobroker url C:\path\to\iobroker.iec104-0.1.12.tgz
iobroker add iec104
```

Aus einem Git-Repository installieren:

```bash
iobroker url https://github.com/your-name/ioBroker.iec104
iobroker add iec104
```

Nach der Installation die Instanz öffnen, die Datenpunkte prüfen und `Kommunikation aktivieren` erst danach einschalten.

## Betriebsarten

### Master / Leitstelle

Im Master-Modus baut der Adapter eine TCP-Verbindung zur IEC-104-Unterstation auf.

Wichtige Einstellungen:

- `Gegenstelle`: IP-Adresse oder Hostname der Unterstation.
- `TCP-Port`: normalerweise 2404.
- `Stationsadresse`: Common Address der Gegenstelle.
- `Generalabfrage nach Verbindung`: sendet nach STARTDT automatisch `C_IC_NA_1`.
- `Intervall der Generalabfrage`: `0` deaktiviert zyklische Generalabfragen.

Empfangene Mess- und Meldedaten werden in die konfigurierten ioBroker-States geschrieben. Wenn eine unbekannte IOA empfangen wird, legt der Adapter unter `iec104.0.points.<IOA>` automatisch einen neuen State an und ergänzt die Datenpunkttabelle der Instanz.

Wenn ein konfigurierter State im Master-Modus geändert wird, sendet der Adapter eine passende Befehls-ASDU an die Gegenstelle. Beispiel: Aus `M_SP_NA_1` wird beim Schreiben ein `C_SC_NA_1`.

### Slave / Unterstation

Im Slave-Modus wartet der Adapter auf eingehende TCP-Verbindungen einer IEC-104-Leitstelle.

Wichtige Einstellungen:

- `Bind-Adresse`: lokale Adresse, auf der der Adapter lauscht. `0.0.0.0` nutzt alle Schnittstellen.
- `TCP-Port`: normalerweise 2404.
- `Stationsadresse`: Common Address, mit der der Adapter antwortet.
- `Nur lesen`: blockiert eingehende Befehle.

Bei einer Generalabfrage sendet der Adapter alle aktivierten Datenpunkte mit Ursache `INTERROGATED_BY_STATION`. Wenn ein konfigurierter ioBroker-State geändert wird, sendet der Adapter eine spontane Meldung an die verbundene Leitstelle.

Es wird nur eine aktive IEC-104-Client-Verbindung gleichzeitig akzeptiert.

## Datenpunkte

Die Datenpunkttabelle ist die zentrale Zuordnung zwischen IEC-104 und ioBroker.

| Spalte | Bedeutung |
| --- | --- |
| Aktiv | Datenpunkt wird verwendet. |
| Name | Anzeigename des ioBroker-States. |
| IOA | Information Object Address. |
| Typ | IEC-104-Typ, z. B. `M_ME_NC_1` oder `C_SC_NA_1`. |
| ioBroker-State | Ziel- oder Quell-State. Leer bedeutet `iec104.0.points.<IOA>`. |
| Schreibbar | Erlaubt eingehende Befehle im Slave-Modus. |
| Einheit | Einheit im ioBroker-Objekt, z. B. `kW`, `V`, `%`. |
| Faktor | Skaliert empfangene Rohwerte: `value = raw * factor + offset`. |
| Offset | Offset für die Skalierung. |

`ioBroker-State` kann ein interner State wie `points.1001` oder eine vollständige fremde State-ID wie `modbus.0.holdingRegisters.40001` sein.

Beispiel:

| Aktiv | Name | IOA | Typ | ioBroker-State | Schreibbar | Einheit | Faktor | Offset |
| --- | --- | ---: | --- | --- | --- | --- | ---: | ---: |
| true | Wirkleistung | 1001 | `M_ME_NC_1` | `points.1001` | false | kW | 1 | 0 |
| true | Schalter | 2001 | `M_SP_NA_1` | `points.2001` | true |  | 1 | 0 |

## States

Der Adapter legt diese allgemeinen States an:

- `iec104.0.info.connection`: Verbindungsstatus.
- `iec104.0.commands.general_interrogation`: Schalter zum manuellen Auslösen einer Generalabfrage im Master-Modus.
- `iec104.0.points.<IOA>`: automatisch oder über die Datenpunkttabelle angelegte Datenpunkte.

## Unterstützte IEC-104-Typen

Melde- und Messwerttypen:

- `M_SP_NA_1` bis `M_PS_NA_1`
- CP56-Varianten `M_SP_TB_1` bis `M_EP_TF_1`

Befehls- und Systemtypen:

- `C_SC_NA_1` bis `C_CD_NA_1`

Dateitypen:

- `F_FR_NA_1` bis `F_DR_TA_1`

Variable Dateinutzdaten werden als Hex-String im ioBroker-State abgelegt.

## Schreiben und Befehle

Im Master-Modus werden unbestätigte Änderungen (`ack=false`) an konfigurierten Datenpunkt-States als IEC-104-Befehl gesendet. Der Adapter wählt für Mess- und Meldetypen automatisch den passenden Befehlstyp:

| Konfigurierter Typ | Gesendeter Befehl |
| --- | --- |
| `M_SP_*` | `C_SC_NA_1` |
| `M_DP_*` | `C_DC_NA_1` |
| `M_ST_*` | `C_RC_NA_1` |
| `M_BO_*` | `C_BO_NA_1` |
| `M_ME_NA_1`, `M_ME_TA_1`, `M_ME_TD_1` | `C_SE_NA_1` |
| `M_ME_NB_1`, `M_ME_TB_1`, `M_ME_TE_1` | `C_SE_NB_1` |
| `M_ME_NC_1`, `M_ME_TC_1`, `M_ME_TF_1` | `C_SE_NC_1` |

Im Slave-Modus werden eingehende Befehle nur ausgeführt, wenn `Nur lesen` deaktiviert ist und der betroffene Datenpunkt in der Tabelle als `Schreibbar` markiert ist.

## Skalierung

Empfangene numerische Werte werden so skaliert:

```text
ioBroker-Wert = IEC-Rohwert * Faktor + Offset
```

Beim Senden wird die Skalierung rückwärts angewendet:

```text
IEC-Rohwert = (ioBroker-Wert - Offset) / Faktor
```

Für Boolesche Werte und Strings wird keine numerische Skalierung angewendet.

## TSV-Import und Export

Die Datenpunkttabelle kann über die Admin-Oberfläche importiert und exportiert werden. Die TSV-Spalten sind:

```text
enabled	name	ioa	type	stateId	writable	unit	factor	offset
```

Beispiel:

```text
true	Wirkleistung	1001	M_ME_NC_1	points.1001	false	kW	1	0
true	Freigabe	2001	M_SP_NA_1	points.2001	true		1	0
```

## Empfohlene Inbetriebnahme

1. Adapter installieren und Instanz anlegen.
2. `Kommunikation aktivieren` deaktiviert lassen.
3. Betriebsart, IP-Adresse, Port und Stationsadresse eintragen.
4. Adresslängen und Zeitparameter mit der Gegenstelle abgleichen.
5. Datenpunkte importieren oder manuell anlegen.
6. Im Master-Modus zunächst `Nur lesen` aktiviert lassen.
7. Kommunikation aktivieren und Logs prüfen.
8. Erst nach erfolgreichem Test Schreibfunktionen freigeben.

## Troubleshooting

Keine Verbindung:

- IP-Adresse, Port und Firewall prüfen.
- Im Slave-Modus sicherstellen, dass der Port auf dem ioBroker-Host freigegeben ist.
- Unter Windows den TCP-Port, meist 2404, in der Windows Defender Firewall erlauben.
- Prüfen, ob bereits ein anderer Dienst denselben Port verwendet.

Verbindung steht, aber keine Werte:

- Common Address und IOA-Länge prüfen.
- Generalabfrage manuell über `commands.general_interrogation` auslösen.
- Datenpunkttypen mit der Dokumentation der Gegenstelle abgleichen.
- Log-Level vorübergehend auf `debug` stellen.

Befehle werden nicht ausgeführt:

- Im Slave-Modus `Nur lesen` deaktivieren.
- Datenpunkt in der Tabelle als `Schreibbar` markieren.
- Prüfen, ob der State mit `ack=false` geändert wurde.
- Common Address und IOA des Befehls prüfen.

Unerwartete Werte:

- Typ prüfen, besonders `M_ME_NA_1` normalisiert, `M_ME_NB_1` skaliert und `M_ME_NC_1` Float.
- Faktor und Offset prüfen.
- Vorzeichen und Wertebereich der Gegenstelle prüfen.

## Sicherheitshinweis

IEC 60870-5-104 wird in Automatisierungs- und Energiesystemen eingesetzt. Vor dem Anschluss an produktive Systeme sollten Konfiguration, Schreibrechte und Befehlsrichtung in einer Testumgebung validiert werden. Schreibfunktionen sollten nur für eindeutig benötigte IOAs aktiviert werden.

## Changelog

### 0.1.12

- Windows-Unterstützung deklariert.
- npm-Paketinhalt explizit festgelegt.

### 0.1.11

- Normale IEC-104-Betriebsdiagnosen von `info` auf `debug` umgestellt.

### 0.1.10

- Empfangene Common Addresses werden je IOA gemerkt und für Master-Befehle verwendet.

### 0.1.9

- Master-Befehlsbestätigungen werden protokolliert.
- States werden nach Aktivierungsbestätigung quittiert.

### 0.1.0

- Erste Version mit Master- und Slave-Modus.

## License

MIT
