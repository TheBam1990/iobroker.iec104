# ioBroker IEC 60870-5-104 Adapter

This adapter connects ioBroker to IEC 60870-5-104. It can run as master/controlling station or as slave/controlled station and maps IEC-104 information objects to ioBroker states.

## Features

- IEC-104 master mode.
- IEC-104 slave mode.
- TCP communication on port 2404 or custom ports.
- STARTDT, STOPDT, TESTFR and I/S/U frames.
- General interrogation `C_IC_NA_1` after connect, manually or periodically.
- Configurable point table with name, IOA, optional ASDU/common address, type, state ID, unit, factor and offset.
- Automatic creation of unknown IOAs in master mode.
- Object tree grouped by ASDU/common address.
- Separate states for value, IV, NT, timestamp and COT.
- Command ASDUs in master mode.
- Spontaneous updates in slave mode when configured ioBroker states change.
- Improved master reconnect handling, including failures before the IEC-104 handshake is complete.
- TSV import and export for the point table.

## Installation

Install a local package:

```bash
iobroker url /path/to/iobroker.iec104-0.1.17.tgz
iobroker add iec104
```

After installation, open the instance, check all point and connection settings and only then enable `Enable communication`.

## Operating Modes

### Master / Controlling Station

In master mode the adapter opens a TCP connection to the IEC-104 controlled station. After STARTDT it can automatically send a general interrogation. Received monitoring data is written to ioBroker states.

When an unknown IOA is received, the adapter creates it automatically and persists it to the adapter configuration in a delayed batch. This avoids restarting the instance during an active general interrogation.

If the connection drops or fails before the IEC-104 handshake is complete, the adapter schedules a reconnect after the configured `Reconnect delay`.

### Slave / Controlled Station

In slave mode the adapter waits for an incoming controlling station connection. On general interrogation it sends all enabled points with `interrogated by station (20)`. When a configured ioBroker state changes, the adapter sends a spontaneous update with `spontaneous (3)`.

Only one active IEC-104 client connection is accepted at a time.

## Object Tree

Since version 0.1.17 internal states are grouped by ASDU/common address:

```text
iec104.0.ASDU-<ASDU>.Value-Points.<IOA>
iec104.0.ASDU-<ASDU>.IV-Points.<IOA>
iec104.0.ASDU-<ASDU>.NT-Points.<IOA>
iec104.0.ASDU-<ASDU>.Time-Points.<IOA>
iec104.0.ASDU-<ASDU>.COT-Points.<IOA>
```

Example for ASDU 1 and IOA 260610:

```text
iec104.0.ASDU-1.Value-Points.260610
iec104.0.ASDU-1.IV-Points.260610
iec104.0.ASDU-1.NT-Points.260610
iec104.0.ASDU-1.Time-Points.260610
iec104.0.ASDU-1.COT-Points.260610
```

### Value-Points

`Value-Points` contains the decoded process value. It replaces the former internal `points` folder and is now placed below the ASDU folder.

If the point table field `ioBroker state` is empty or still contains `points.<IOA>`, the adapter automatically uses the new internal path `ASDU-<ASDU>.Value-Points.<IOA>`.

Full external state IDs, for example `modbus.0.holdingRegisters.40001`, remain unchanged.

### IV-Points

`IV-Points` contains the IEC-104 quality bit `IV`:

- `false`: The value is valid according to the IEC quality byte.
- `true`: `IV` is set, the value is invalid.

The bit is read from the quality byte of supported monitoring types.

### NT-Points

`NT-Points` contains the IEC-104 quality bit `NT` (`not topical`):

- `false`: The value is not marked as not topical.
- `true`: `NT` is set, the value is not topical.

The bit is read directly from the IEC-104 quality byte. It is evaluated for the same supported monitoring types as `IV`, meaning all supported monitoring types with a quality byte.

### Time-Points

`Time-Points` contains the latest timestamp as ISO string:

- CP56 types use the full IEC timestamp.
- CP24 types use minute, second and millisecond from IEC and complete date/hour from the receive time.
- Types without IEC timestamp use the local receive time.

### COT-Points

`COT-Points` contains the last cause of transmission as English text including the numeric code, for example:

```text
spontaneous (3)
interrogated by station (20)
activation confirmation (7)
unknown common address of ASDU (46)
```

This makes it visible whether the last update was spontaneous, from general interrogation, an activation confirmation or an error cause.

## Point Table

| Column | Meaning |
| --- | --- |
| Active | Enables the point. |
| Name | Display name of the ioBroker state. |
| IOA | Information object address. |
| ASDU | Optional common address for this point. Empty uses the instance common address. |
| Type | IEC-104 type, e.g. `M_ME_NC_1` or `M_SP_NA_1`. |
| ioBroker state | Internal or external state. Empty means the new internal `ASDU-<ASDU>.Value-Points.<IOA>` path. |
| Writable | Allows incoming commands in slave mode. |
| Unit | Unit used in the ioBroker object. |
| Factor | Scales received raw values: `value = raw * factor + offset`. |
| Offset | Offset for scaling. |

TSV columns:

```text
enabled	name	ioa	commonAddress	type	stateId	writable	unit	factor	offset
```

## Writing and Commands

In master mode unacknowledged changes (`ack=false`) to configured point states are sent as IEC-104 commands. The adapter selects a matching command type for monitoring types, for example `M_SP_*` to `C_SC_NA_1` or `M_ME_NC_*` to `C_SE_NC_1`.

In slave mode incoming commands are only executed when `Read only` is disabled and the point is marked as `Writable`.

## Troubleshooting

No connection:

- Check IP address, port and firewall.
- In slave mode, check that the port is free on the ioBroker host.
- Check `Reconnect delay`. The master reconnects automatically after a disconnect.
- Set log level to `debug` if the IEC-104 handshake needs to be analyzed.

Connected, but no values:

- Check common address, COT length, common-address length and IOA length.
- Trigger general interrogation manually with `commands.general_interrogation`.
- Compare point types with the remote station documentation.
- Check `COT-Points` to see the last cause of transmission.
- Check `IV-Points` and `NT-Points` to see whether the remote station marks values as invalid or not topical.

Spontaneous changes are not received:

- Verify that the remote station really sends ASDUs with COT `spontaneous (3)`.
- Set log level to `debug` and search for `IEC-104 ASDU rx`.
- Check IOA length and common address. Wrong lengths shift decoding.

Commands are not executed:

- In slave mode, disable `Read only`.
- Mark the point as `Writable`.
- Check that the state was written with `ack=false`.
