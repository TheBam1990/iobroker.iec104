# ioBroker IEC 60870-5-104 Adapter

ioBroker adapter for IEC 60870-5-104 master and slave communication.

The adapter can run as an IEC-104 master or slave. Received points are grouped by ASDU/common address below `ASDU-<address>`. Each ASDU contains separate folders for values, IV quality, NT quality, timestamps and COT information.

## Features

- Master mode for connecting to an IEC-104 controlled station.
- Slave mode for exposing configured ioBroker states over IEC-104.
- General interrogation after connect and optional cyclic interrogation.
- Configurable COT, common address and IOA field sizes.
- Configurable data point table with import and export support.
- State layout grouped by ASDU/common address.
- Separate states for value, IV, NT, timestamp and COT text.

## Configuration

Set the connection mode first:

- `Master / controlling station`: connects to a remote IEC-104 slave.
- `Slave / controlled station`: listens locally for a remote IEC-104 master.

Common settings:

| Setting | Meaning |
| --- | --- |
| `Remote host` | Remote host used in master mode. |
| `TCP port` | IEC-104 TCP port, usually `2404`. |
| `Bind address` | Local bind address used in slave mode. |
| `Common address` | Default common address for configured points. |
| `Originator address` | Originator address used in ASDUs. |
| `Read only` | Reject command ASDUs from the remote side. |

## Data Points

Configured points define how IEC-104 IOAs are mapped to ioBroker states. The table supports monitoring types, command types, timestamps, scaling and optional per-point common addresses.

The adapter also stores received points below `ASDU-<address>` so values from different common addresses remain separated.

## Changelog

### 0.1.19

- Removed old unpublished changelog entries from `io-package.json`.
- Added responsive metadata for the data point table.

### 0.1.18

- Added repository metadata, CI release automation and adapter checker compatibility for public ioBroker publication.

### 0.1.17

- Reorganized states by ASDU with Value, IV, NT, Time and COT folders.
- Exposed NT quality and COT text states.
- Improved master reconnect handling.

### 0.1.16

- Batched discovered data point persistence to avoid restarts during general interrogation.
- Retried with learned common address on `UNKNOWN_CA`.

### 0.1.15

- Added time point states with IEC-104 CP24/CP56 timestamps or receive time fallback.

### 0.1.14

- Extended IV quality decoding to all supported IEC-104 monitoring types with quality bits.

### 0.1.13

- Exposed IEC-104 IV quality bit as separate IV point states for each data point.

### 0.1.12

- Declared Windows support and made npm package contents explicit.

## License

Copyright (c) 2026 TheBam1990

MIT License. See [LICENSE](LICENSE) for details.
