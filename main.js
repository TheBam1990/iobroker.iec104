"use strict";

const net = require("net");
const utils = require("@iobroker/adapter-core");

const TYPE = {
    M_SP_NA_1: 1,
    M_SP_TA_1: 2,
    M_DP_NA_1: 3,
    M_DP_TA_1: 4,
    M_ST_NA_1: 5,
    M_ST_TA_1: 6,
    M_BO_NA_1: 7,
    M_BO_TA_1: 8,
    M_ME_NA_1: 9,
    M_ME_TA_1: 10,
    M_ME_NB_1: 11,
    M_ME_TB_1: 12,
    M_ME_NC_1: 13,
    M_ME_TC_1: 14,
    M_IT_NA_1: 15,
    M_IT_TA_1: 16,
    M_EP_TA_1: 17,
    M_EP_TB_1: 18,
    M_EP_TC_1: 19,
    M_PS_NA_1: 20,
    M_SP_TB_1: 30,
    M_DP_TB_1: 31,
    M_ST_TB_1: 32,
    M_BO_TB_1: 33,
    M_ME_TD_1: 34,
    M_ME_TE_1: 35,
    M_ME_TF_1: 36,
    M_IT_TB_1: 37,
    M_EP_TD_1: 38,
    M_EP_TE_1: 39,
    M_EP_TF_1: 40,
    C_SC_NA_1: 45,
    C_DC_NA_1: 46,
    C_RC_NA_1: 47,
    C_SE_NA_1: 48,
    C_SE_NB_1: 49,
    C_SE_NC_1: 50,
    C_BO_NA_1: 51,
    C_SC_TA_1: 58,
    C_DC_TA_1: 59,
    C_RC_TA_1: 60,
    C_SE_TA_1: 61,
    C_SE_TB_1: 62,
    C_SE_TC_1: 63,
    C_BO_TA_1: 64,
    C_IC_NA_1: 100,
    C_CI_NA_1: 101,
    C_RD_NA_1: 102,
    C_CS_NA_1: 103,
    C_TS_NA_1: 104,
    C_RP_NA_1: 105,
    C_CD_NA_1: 106,
    F_FR_NA_1: 120,
    F_SR_NA_1: 121,
    F_SC_NA_1: 122,
    F_LS_NA_1: 123,
    F_AF_NA_1: 124,
    F_SG_NA_1: 125,
    F_DR_TA_1: 126,
};

const TYPE_NAME = Object.fromEntries(Object.entries(TYPE).map(([key, value]) => [value, key]));

const TYPE_META = {
    M_SP_NA_1: { label: "Single Point Information / Einzelmeldung (0/1)", valueKind: "boolean", base: "M_SP_NA_1" },
    M_SP_TA_1: { label: "Single Point with Time Tag / Einzelmeldung mit Zeitstempel", valueKind: "boolean", base: "M_SP_NA_1", time: "cp24" },
    M_DP_NA_1: { label: "Double Point Information / Doppelmeldung", valueKind: "number", base: "M_DP_NA_1" },
    M_DP_TA_1: { label: "Double Point with Time Tag / Doppelmeldung mit Zeitstempel", valueKind: "number", base: "M_DP_NA_1", time: "cp24" },
    M_ST_NA_1: { label: "Step Position Information / Stufenstellung", valueKind: "number", base: "M_ST_NA_1" },
    M_ST_TA_1: { label: "Step Position with Time Tag / Stufenstellung mit Zeit", valueKind: "number", base: "M_ST_NA_1", time: "cp24" },
    M_BO_NA_1: { label: "Bitstring 32 Bit / 32-Bit Bitfolge", valueKind: "number", base: "M_BO_NA_1" },
    M_BO_TA_1: { label: "Bitstring with Time Tag / Bitfolge mit Zeit", valueKind: "number", base: "M_BO_NA_1", time: "cp24" },
    M_ME_NA_1: { label: "Measured Value Normalized / Normierter Messwert (-1..+1)", valueKind: "number", base: "M_ME_NA_1" },
    M_ME_TA_1: { label: "Measured Value Normalized + Time / Normiert mit Zeit", valueKind: "number", base: "M_ME_NA_1", time: "cp24" },
    M_ME_NB_1: { label: "Measured Value Scaled / Skalierter Messwert", valueKind: "number", base: "M_ME_NB_1" },
    M_ME_TB_1: { label: "Measured Value Scaled + Time / Skaliert mit Zeit", valueKind: "number", base: "M_ME_NB_1", time: "cp24" },
    M_ME_NC_1: { label: "Measured Value Short Float / Float (IEEE754)", valueKind: "number", base: "M_ME_NC_1" },
    M_ME_TC_1: { label: "Measured Value Float + Time / Float mit Zeit", valueKind: "number", base: "M_ME_NC_1", time: "cp24" },
    M_IT_NA_1: { label: "Integrated Total / Zählerstand", valueKind: "number", base: "M_IT_NA_1" },
    M_IT_TA_1: { label: "Integrated Total + Time / Zählerstand mit Zeit", valueKind: "number", base: "M_IT_NA_1", time: "cp24" },
    M_EP_TA_1: { label: "Event Protection / Schutzereignis", valueKind: "number", base: "M_EP_TA_1", time: "cp24" },
    M_EP_TB_1: { label: "Packed Protection Event / Schutzereignis", valueKind: "number", base: "M_EP_TB_1", time: "cp24" },
    M_EP_TC_1: { label: "Protection Command / Schutzkommando", valueKind: "number", base: "M_EP_TC_1", time: "cp24" },
    M_PS_NA_1: { label: "Packed Single Point / Gepackte Meldungen", valueKind: "number", base: "M_PS_NA_1" },
    M_SP_TB_1: { label: "Single Point + CP56", valueKind: "boolean", base: "M_SP_NA_1", time: "cp56" },
    M_DP_TB_1: { label: "Double Point + CP56", valueKind: "number", base: "M_DP_NA_1", time: "cp56" },
    M_ST_TB_1: { label: "Step Position + CP56", valueKind: "number", base: "M_ST_NA_1", time: "cp56" },
    M_BO_TB_1: { label: "Bitstring + CP56", valueKind: "number", base: "M_BO_NA_1", time: "cp56" },
    M_ME_TD_1: { label: "Normalized + CP56", valueKind: "number", base: "M_ME_NA_1", time: "cp56" },
    M_ME_TE_1: { label: "Scaled + CP56", valueKind: "number", base: "M_ME_NB_1", time: "cp56" },
    M_ME_TF_1: { label: "Float + CP56", valueKind: "number", base: "M_ME_NC_1", time: "cp56" },
    M_IT_TB_1: { label: "Counter + CP56", valueKind: "number", base: "M_IT_NA_1", time: "cp56" },
    M_EP_TD_1: { label: "Protection Event + CP56", valueKind: "number", base: "M_EP_TA_1", time: "cp56" },
    M_EP_TE_1: { label: "Packed Protection + CP56", valueKind: "number", base: "M_EP_TB_1", time: "cp56" },
    M_EP_TF_1: { label: "Protection Command + CP56", valueKind: "number", base: "M_EP_TC_1", time: "cp56" },
    C_SC_NA_1: { label: "Single Command", valueKind: "boolean", base: "C_SC_NA_1", command: true },
    C_DC_NA_1: { label: "Double Command", valueKind: "number", base: "C_DC_NA_1", command: true },
    C_RC_NA_1: { label: "Regulating Step Command", valueKind: "number", base: "C_RC_NA_1", command: true },
    C_SE_NA_1: { label: "Setpoint Normalized", valueKind: "number", base: "C_SE_NA_1", command: true },
    C_SE_NB_1: { label: "Setpoint Scaled", valueKind: "number", base: "C_SE_NB_1", command: true },
    C_SE_NC_1: { label: "Setpoint Float", valueKind: "number", base: "C_SE_NC_1", command: true },
    C_BO_NA_1: { label: "Bitstring Command", valueKind: "number", base: "C_BO_NA_1", command: true },
    C_SC_TA_1: { label: "Single Command + Time", valueKind: "boolean", base: "C_SC_NA_1", command: true, time: "cp56" },
    C_DC_TA_1: { label: "Double Command + Time", valueKind: "number", base: "C_DC_NA_1", command: true, time: "cp56" },
    C_RC_TA_1: { label: "Regulating Command + Time", valueKind: "number", base: "C_RC_NA_1", command: true, time: "cp56" },
    C_SE_TA_1: { label: "Setpoint Normalized + Time", valueKind: "number", base: "C_SE_NA_1", command: true, time: "cp56" },
    C_SE_TB_1: { label: "Setpoint Scaled + Time", valueKind: "number", base: "C_SE_NB_1", command: true, time: "cp56" },
    C_SE_TC_1: { label: "Setpoint Float + Time", valueKind: "number", base: "C_SE_NC_1", command: true, time: "cp56" },
    C_BO_TA_1: { label: "Bitstring Command + Time", valueKind: "number", base: "C_BO_NA_1", command: true, time: "cp56" },
    C_IC_NA_1: { label: "General Interrogation", valueKind: "number", base: "C_IC_NA_1", command: true },
    C_CI_NA_1: { label: "Counter Interrogation", valueKind: "number", base: "C_CI_NA_1", command: true },
    C_RD_NA_1: { label: "Read Command", valueKind: "number", base: "C_RD_NA_1", command: true },
    C_CS_NA_1: { label: "Clock Synchronization", valueKind: "string", base: "C_CS_NA_1", command: true },
    C_TS_NA_1: { label: "Test Command", valueKind: "number", base: "C_TS_NA_1", command: true },
    C_RP_NA_1: { label: "Reset Process", valueKind: "number", base: "C_RP_NA_1", command: true },
    C_CD_NA_1: { label: "Delay Acquisition", valueKind: "number", base: "C_CD_NA_1", command: true },
    F_FR_NA_1: { label: "File Ready", valueKind: "string", base: "F_FR_NA_1", file: true },
    F_SR_NA_1: { label: "Section Ready", valueKind: "string", base: "F_SR_NA_1", file: true },
    F_SC_NA_1: { label: "Call Directory", valueKind: "string", base: "F_SC_NA_1", file: true },
    F_LS_NA_1: { label: "Last Section", valueKind: "string", base: "F_LS_NA_1", file: true },
    F_AF_NA_1: { label: "Ack File", valueKind: "string", base: "F_AF_NA_1", file: true },
    F_SG_NA_1: { label: "Segment", valueKind: "string", base: "F_SG_NA_1", file: true, variable: true },
    F_DR_TA_1: { label: "Directory", valueKind: "string", base: "F_DR_TA_1", file: true, variable: true },
};

const COMMAND_TYPE_IDS = new Set(Object.entries(TYPE_META).filter(([, meta]) => meta.command).map(([name]) => TYPE[name]));

const COMMAND_TO_MONITORING_TYPE = {
    C_SC_NA_1: "M_SP_NA_1",
    C_DC_NA_1: "M_DP_NA_1",
    C_RC_NA_1: "M_ST_NA_1",
    C_SE_NA_1: "M_ME_NA_1",
    C_SE_NB_1: "M_ME_NB_1",
    C_SE_NC_1: "M_ME_NC_1",
    C_BO_NA_1: "M_BO_NA_1",
    C_SC_TA_1: "M_SP_TB_1",
    C_DC_TA_1: "M_DP_TB_1",
    C_RC_TA_1: "M_ST_TB_1",
    C_SE_TA_1: "M_ME_TD_1",
    C_SE_TB_1: "M_ME_TE_1",
    C_SE_TC_1: "M_ME_TF_1",
    C_BO_TA_1: "M_BO_TB_1",
};

const MONITORING_TO_COMMAND_TYPE = {
    M_SP_NA_1: "C_SC_NA_1",
    M_SP_TA_1: "C_SC_NA_1",
    M_SP_TB_1: "C_SC_NA_1",
    M_DP_NA_1: "C_DC_NA_1",
    M_DP_TA_1: "C_DC_NA_1",
    M_DP_TB_1: "C_DC_NA_1",
    M_ST_NA_1: "C_RC_NA_1",
    M_ST_TA_1: "C_RC_NA_1",
    M_ST_TB_1: "C_RC_NA_1",
    M_BO_NA_1: "C_BO_NA_1",
    M_BO_TA_1: "C_BO_NA_1",
    M_BO_TB_1: "C_BO_NA_1",
    M_ME_NA_1: "C_SE_NA_1",
    M_ME_TA_1: "C_SE_NA_1",
    M_ME_TD_1: "C_SE_NA_1",
    M_ME_NB_1: "C_SE_NB_1",
    M_ME_TB_1: "C_SE_NB_1",
    M_ME_TE_1: "C_SE_NB_1",
    M_ME_NC_1: "C_SE_NC_1",
    M_ME_TC_1: "C_SE_NC_1",
    M_ME_TF_1: "C_SE_NC_1",
};

const COT = {
    PERIODIC: 1,
    BACKGROUND: 2,
    SPONTANEOUS: 3,
    INITIALIZED: 4,
    REQUEST: 5,
    ACTIVATION: 6,
    ACTIVATION_CONFIRMATION: 7,
    DEACTIVATION: 8,
    DEACTIVATION_CONFIRMATION: 9,
    ACTIVATION_TERMINATION: 10,
    INTERROGATED_BY_STATION: 20,
    UNKNOWN_TYPE: 44,
    UNKNOWN_COT: 45,
    UNKNOWN_CA: 46,
    UNKNOWN_IOA: 47,
};

class Iec104Connection {
    constructor(adapter, socket, role) {
        this.adapter = adapter;
        this.socket = socket;
        this.role = role;
        this.rxBuffer = Buffer.alloc(0);
        this.sendSeq = 0;
        this.recvSeq = 0;
        this.started = false;
        this.closed = false;
        this.t3Timer = null;
        this.t2Timer = null;
        this.lastRx = Date.now();
        this.onClose = null;
        this.onStarted = null;
        this.onAsdu = null;

        this.socket.on("data", data => this.handleData(data));
        this.socket.on("close", () => this.close());
        this.socket.on("error", error => {
            this.adapter.log.warn(`${this.role} socket error: ${error.message}`);
            this.close();
        });
        this.startTimers();
    }

    get cfg() {
        return this.adapter.protocolConfig;
    }

    startTimers() {
        this.stopTimers();
        this.t3Timer = setInterval(() => {
            if (this.closed) return;
            if (Date.now() - this.lastRx >= this.cfg.t3TimeoutMs) {
                this.sendU(0x43);
            }
        }, Math.max(1000, Math.floor(this.cfg.t3TimeoutMs / 2)));
    }

    stopTimers() {
        if (this.t3Timer) clearInterval(this.t3Timer);
        if (this.t2Timer) clearTimeout(this.t2Timer);
        this.t3Timer = null;
        this.t2Timer = null;
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        this.stopTimers();
        try {
            this.socket.destroy();
        } catch {
            // ignore close cleanup errors
        }
        if (this.onClose) this.onClose();
    }

    handleData(data) {
        this.rxBuffer = Buffer.concat([this.rxBuffer, data]);
        while (this.rxBuffer.length >= 2) {
            const start = this.rxBuffer.indexOf(0x68);
            if (start < 0) {
                this.rxBuffer = Buffer.alloc(0);
                return;
            }
            if (start > 0) {
                this.rxBuffer = this.rxBuffer.subarray(start);
            }
            if (this.rxBuffer.length < 2) return;
            const length = this.rxBuffer[1];
            if (this.rxBuffer.length < length + 2) return;
            const apdu = this.rxBuffer.subarray(0, length + 2);
            this.rxBuffer = this.rxBuffer.subarray(length + 2);
            this.handleApdu(apdu);
        }
    }

    handleApdu(apdu) {
        this.lastRx = Date.now();
        if (apdu.length < 6 || apdu[0] !== 0x68) {
            this.adapter.log.warn(`Invalid IEC-104 APDU: ${apdu.toString("hex")}`);
            return;
        }

        const c0 = apdu[2];
        if ((c0 & 0x01) === 0) {
            this.handleIFrame(apdu);
        } else if ((c0 & 0x03) === 0x01) {
            this.handleSFrame(apdu);
        } else if ((c0 & 0x03) === 0x03) {
            this.handleUFrame(apdu);
        }
    }

    handleIFrame(apdu) {
        const send = (apdu[2] | (apdu[3] << 8)) >> 1;
        const receive = (apdu[4] | (apdu[5] << 8)) >> 1;
        this.adapter.log.debug(`IEC-104 I-frame rx send=${send} ack=${receive}`);
        this.recvSeq = send + 1;
        const asdu = apdu.subarray(6);
        if (this.onAsdu) this.onAsdu(asdu, this);
        this.scheduleAck();
    }

    handleSFrame(apdu) {
        const receive = (apdu[4] | (apdu[5] << 8)) >> 1;
        this.adapter.log.debug(`IEC-104 S-frame ack=${receive}`);
    }

    handleUFrame(apdu) {
        const code = apdu[2];
        if (code === 0x07) {
            this.adapter.log.debug(`IEC-104 STARTDT act received from ${this.role}`);
            this.sendU(0x0b);
            this.started = true;
            if (this.onStarted) this.onStarted(this);
        } else if (code === 0x0b) {
            this.adapter.log.debug(`IEC-104 STARTDT con received from ${this.role}`);
            this.started = true;
            if (this.onStarted) this.onStarted(this);
        } else if (code === 0x13) {
            this.adapter.log.debug(`IEC-104 STOPDT act received from ${this.role}`);
            this.started = false;
            this.sendU(0x23);
        } else if (code === 0x23) {
            this.adapter.log.debug(`IEC-104 STOPDT con received from ${this.role}`);
            this.started = false;
        } else if (code === 0x43) {
            this.sendU(0x83);
        } else if (code === 0x83) {
            this.adapter.log.debug(`IEC-104 TESTFR con received from ${this.role}`);
        } else {
            this.adapter.log.warn(`Unknown IEC-104 U-frame code 0x${code.toString(16)}`);
        }
    }

    scheduleAck() {
        if (this.t2Timer) return;
        this.t2Timer = setTimeout(() => {
            this.t2Timer = null;
            if (!this.closed) this.sendS();
        }, this.cfg.t2TimeoutMs);
    }

    sendStartDt() {
        this.sendU(0x07);
    }

    sendU(code) {
        this.write(Buffer.from([0x68, 0x04, code, 0x00, 0x00, 0x00]));
    }

    sendS() {
        const ack = this.recvSeq << 1;
        this.write(Buffer.from([0x68, 0x04, 0x01, 0x00, ack & 0xff, (ack >> 8) & 0xff]));
    }

    sendAsdu(asdu) {
        const send = this.sendSeq << 1;
        const receive = this.recvSeq << 1;
        const ctrl = Buffer.from([send & 0xff, (send >> 8) & 0xff, receive & 0xff, (receive >> 8) & 0xff]);
        this.sendSeq++;
        this.write(Buffer.concat([Buffer.from([0x68, ctrl.length + asdu.length]), ctrl, asdu]));
    }

    write(buf) {
        if (this.closed || !this.socket || this.socket.destroyed) return;
        this.socket.write(buf);
    }
}

class Iec104Adapter extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: "iec104",
        });

        this.server = null;
        this.connection = null;
        this.reconnectTimer = null;
        this.generalInterrogationTimer = null;
        this.points = [];
        this.pointsByIoa = new Map();
        this.pointsByState = new Map();
        this.configUpdatePromise = Promise.resolve();

        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    get protocolConfig() {
        return {
            mode: String(this.config.mode || "master"),
            enabled: this.config.enabled === true || this.config.enabled === "true",
            host: String(this.config.host || "127.0.0.1"),
            port: Number(this.config.port || 2404),
            bind: String(this.config.bind || "0.0.0.0"),
            commonAddress: Number(this.config.commonAddress || 1),
            originatorAddress: Number(this.config.originatorAddress || 0),
            cotSize: Number(this.config.cotSize || 2),
            commonAddressSize: Number(this.config.commonAddressSize || 2),
            ioaSize: Number(this.config.ioaSize || 3),
            connectTimeoutMs: Number(this.config.connectTimeoutMs || 10000),
            reconnectDelayMs: Number(this.config.reconnectDelayMs || 10000),
            t1TimeoutMs: Number(this.config.t1TimeoutMs || 15000),
            t2TimeoutMs: Number(this.config.t2TimeoutMs || 10000),
            t3TimeoutMs: Number(this.config.t3TimeoutMs || 20000),
            kWindow: Number(this.config.kWindow || 12),
            wWindow: Number(this.config.wWindow || 8),
            autoGeneralInterrogation: this.config.autoGeneralInterrogation !== false,
            generalInterrogationIntervalMs: Number(this.config.generalInterrogationIntervalMs || 0),
            readOnly: this.config.readOnly !== false,
        };
    }

    async onReady() {
        await this.setObjectNotExistsAsync("info", {
            type: "channel",
            common: { name: "Information" },
            native: {},
        });
        await this.setObjectNotExistsAsync("info.connection", {
            type: "state",
            common: { name: "Connection", type: "boolean", role: "indicator.connected", read: true, write: false },
            native: {},
        });
        await this.setObjectNotExistsAsync("commands", {
            type: "channel",
            common: { name: "Commands" },
            native: {},
        });
        await this.setObjectNotExistsAsync("commands.general_interrogation", {
            type: "state",
            common: {
                name: "Trigger general interrogation",
                type: "boolean",
                role: "button",
                read: true,
                write: true,
                def: false,
            },
            native: {},
        });

        await this.setStateAsync("info.connection", false, true);
        await this.subscribeStatesAsync("commands.general_interrogation");

        this.points = this.normalizePoints(this.config.points || []);
        await this.createPointObjects();
        await this.subscribeConfiguredStates();

        if (!this.protocolConfig.enabled) {
            this.log.warn("IEC-104 communication is disabled in adapter settings");
            return;
        }

        if (this.protocolConfig.mode === "slave") {
            this.startSlave();
        } else {
            this.startMaster();
        }
    }

    onUnload(callback) {
        try {
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            if (this.generalInterrogationTimer) clearInterval(this.generalInterrogationTimer);
            if (this.connection) this.connection.close();
            if (this.server) this.server.close();
            callback();
        } catch {
            callback();
        }
    }

    async onStateChange(id, state) {
        if (!state || state.ack) return;

        if (id === `${this.namespace}.commands.general_interrogation`) {
            await this.setStateAsync("commands.general_interrogation", false, true);
            if (this.connection && this.protocolConfig.mode === "master") {
                this.sendGeneralInterrogation(this.connection);
            }
            return;
        }

        const point = this.pointsByState.get(id);
        if (!point || !point.enabled) return;

        if (!this.connection || !this.connection.started) {
            this.log.warn(`Cannot send IEC-104 value for IOA ${point.ioa}: no active connection`);
            return;
        }
        if (this.protocolConfig.mode === "slave") {
            this.log.debug(`Sending IEC-104 spontaneous update IOA ${point.ioa} type ${this.outboundTypeForPoint(point)} value ${state.val}`);
            this.connection.sendAsdu(this.buildSinglePointAsdu(point, state.val, COT.SPONTANEOUS));
        } else {
            const asdu = this.buildCommandAsdu(point, state.val);
            if (!asdu) {
                this.log.warn(`No IEC-104 command type available for IOA ${point.ioa} (${point.type})`);
                return;
            }
            this.log.debug(`Sending IEC-104 command IOA ${point.ioa} CA ${this.commonAddressForPoint(point)} type ${this.commandTypeForPoint(point)} value ${state.val} asdu=${asdu.toString("hex")}`);
            this.connection.sendAsdu(asdu);
        }
    }

    normalizePoints(points) {
        return (Array.isArray(points) ? points : [])
            .filter(point => point && point.ioa !== undefined && point.ioa !== null && point.ioa !== "")
            .map(point => ({
                enabled: point.enabled !== false,
                name: String(point.name || `IOA ${point.ioa}`),
                ioa: Number(point.ioa),
                type: String(point.type || "M_ME_NC_1"),
                stateId: String(point.stateId || "").trim(),
                writable: point.writable === true || point.writable === "true",
                unit: String(point.unit || ""),
                factor: Number(point.factor || 1),
                offset: Number(point.offset || 0),
            }));
    }

    stateIdForPoint(point) {
        return point.stateId || `points.${point.ioa}`;
    }

    fullStateIdForPoint(point) {
        const id = this.stateIdForPoint(point);
        return id.startsWith(`${this.namespace}.`) || !this.isOwnStateId(id) ? id : `${this.namespace}.${id}`;
    }

    isOwnStateId(id) {
        return id.startsWith("points.") || id.startsWith("commands.") || id.startsWith("info.");
    }

    async createPointObjects() {
        await this.setObjectNotExistsAsync("points", {
            type: "channel",
            common: { name: "IEC-104 data points" },
            native: {},
        });

        for (const point of this.points) {
            if (!point.enabled) continue;
            this.pointsByIoa.set(point.ioa, point);
            const id = this.stateIdForPoint(point);
            if (this.isOwnStateId(id)) {
                await this.extendObjectAsync(id.replace(`${this.namespace}.`, ""), {
                    type: "state",
                    common: {
                        name: point.name,
                        type: this.jsTypeForPoint(point),
                        role: this.roleForPoint(point),
                        unit: point.unit || "",
                        read: true,
                        write: point.writable || this.protocolConfig.mode === "master",
                    },
                    native: { ioa: point.ioa, iecType: point.type },
                });
            }
            this.pointsByState.set(this.fullStateIdForPoint(point), point);
        }
    }

    async subscribeConfiguredStates() {
        if (this.protocolConfig.mode === "slave" || this.protocolConfig.mode === "master") {
            for (const point of this.points) {
                if (point.enabled) {
                    const id = this.fullStateIdForPoint(point);
                    await this.subscribeForeignStatesAsync(id);
                    this.log.debug(`Subscribed IEC-104 ${this.protocolConfig.mode} data point ${id} for IOA ${point.ioa}`);
                }
            }
        }
    }

    jsTypeForPoint(point) {
        const meta = TYPE_META[point.type];
        if (meta && meta.valueKind === "boolean") return "boolean";
        if (meta && meta.valueKind === "string") return "string";
        return "number";
    }

    roleForPoint(point) {
        const meta = TYPE_META[point.type];
        if (meta && meta.command) return "level";
        if (meta && meta.valueKind === "boolean") return "state";
        return "value";
    }

    startMaster() {
        const cfg = this.protocolConfig;
        this.log.debug(`Starting IEC-104 master client to ${cfg.host}:${cfg.port}`);
        const socket = net.createConnection({ host: cfg.host, port: cfg.port });
        const connectTimer = setTimeout(() => {
            this.log.warn(`IEC-104 connect timeout to ${cfg.host}:${cfg.port}`);
            socket.destroy();
        }, cfg.connectTimeoutMs);

        socket.on("connect", () => {
            clearTimeout(connectTimer);
            this.connection = this.createConnection(socket, "master");
            this.connection.onStarted = conn => {
                void this.setStateAsync("info.connection", true, true);
                if (cfg.autoGeneralInterrogation) this.sendGeneralInterrogation(conn);
                this.startGeneralInterrogationTimer();
            };
            this.connection.sendStartDt();
        });

        socket.on("error", error => {
            clearTimeout(connectTimer);
            this.log.warn(`IEC-104 master socket error: ${error.message}`);
        });
    }

    startSlave() {
        const cfg = this.protocolConfig;
        this.log.debug(`Starting IEC-104 slave server on ${cfg.bind}:${cfg.port}`);
        this.server = net.createServer(socket => {
            if (this.connection && !this.connection.closed) {
                this.log.warn("Rejecting additional IEC-104 client because one client is already connected");
                socket.destroy();
                return;
            }

            this.connection = this.createConnection(socket, "slave");
            this.connection.onStarted = () => {
                void this.setStateAsync("info.connection", true, true);
            };
        });

        this.server.on("error", error => {
            this.log.error(`IEC-104 slave server error: ${error.message}`);
            void this.setStateAsync("info.connection", false, true);
        });
        this.server.listen(cfg.port, cfg.bind);
    }

    createConnection(socket, role) {
        const conn = new Iec104Connection(this, socket, role);
        conn.onAsdu = (asdu, connection) => void this.handleAsdu(asdu, connection);
        conn.onClose = () => {
            void this.setStateAsync("info.connection", false, true);
            if (this.connection === conn) this.connection = null;
            if (this.protocolConfig.mode === "master" && this.protocolConfig.enabled) {
                this.scheduleReconnect();
            }
        };
        return conn;
    }

    scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.startMaster();
        }, this.protocolConfig.reconnectDelayMs);
    }

    startGeneralInterrogationTimer() {
        if (this.generalInterrogationTimer) clearInterval(this.generalInterrogationTimer);
        const interval = this.protocolConfig.generalInterrogationIntervalMs;
        if (interval > 0) {
            this.generalInterrogationTimer = setInterval(() => {
                if (this.connection && this.connection.started) this.sendGeneralInterrogation(this.connection);
            }, interval);
        }
    }

    sendGeneralInterrogation(conn) {
        this.log.debug("Sending IEC-104 general interrogation");
        conn.sendAsdu(this.buildAsdu(TYPE.C_IC_NA_1, false, COT.ACTIVATION, this.protocolConfig.commonAddress, [
            { ioa: 0, data: Buffer.from([20]) },
        ]));
    }

    async handleAsdu(asdu, conn) {
        try {
            const decoded = this.decodeAsdu(asdu);
            if (!decoded) return;

            if (decoded.typeId === TYPE.C_IC_NA_1) {
                await this.handleGeneralInterrogation(decoded, conn);
                return;
            }

            if (COMMAND_TYPE_IDS.has(decoded.typeId) && this.protocolConfig.mode === "slave") {
                await this.handleCommand(decoded, conn);
                return;
            }

            if (COMMAND_TYPE_IDS.has(decoded.typeId)) {
                await this.handleCommandResponse(decoded);
                return;
            }

            for (const obj of decoded.objects) {
                await this.updatePointFromRemote(decoded.typeId, obj, decoded.commonAddress);
            }
        } catch (error) {
            this.log.warn(`Cannot handle IEC-104 ASDU: ${error.message}`);
        }
    }

    async handleGeneralInterrogation(decoded, conn) {
        if (this.protocolConfig.mode !== "slave") {
            this.log.debug("General interrogation response marker received");
            return;
        }

        this.log.debug("General interrogation received");
        conn.sendAsdu(this.buildAsdu(TYPE.C_IC_NA_1, false, COT.ACTIVATION_CONFIRMATION, decoded.commonAddress, [
            { ioa: 0, data: Buffer.from([20]) },
        ]));

        for (const point of this.points) {
            if (!point.enabled) continue;
            const state = await this.getForeignStateAsync(this.fullStateIdForPoint(point));
            conn.sendAsdu(this.buildSinglePointAsdu(point, state ? state.val : null, COT.INTERROGATED_BY_STATION));
        }

        conn.sendAsdu(this.buildAsdu(TYPE.C_IC_NA_1, false, COT.ACTIVATION_TERMINATION, decoded.commonAddress, [
            { ioa: 0, data: Buffer.from([20]) },
        ]));
    }

    async handleCommand(decoded, conn) {
        if (this.protocolConfig.readOnly) {
            this.log.warn(`Command ${TYPE_NAME[decoded.typeId] || decoded.typeId} rejected because read-only mode is active`);
            conn.sendAsdu(this.buildAsdu(decoded.typeId, false, COT.ACTIVATION_CONFIRMATION | 0x40, decoded.commonAddress, decoded.objects));
            return;
        }

        for (const obj of decoded.objects) {
            const point = this.pointsByIoa.get(obj.ioa);
            if (!point || !point.writable) {
                this.log.warn(`Command for unknown or non-writable IOA ${obj.ioa}`);
                continue;
            }
            const value = this.decodeCommandValue(decoded.typeId, obj.data);
            await this.setForeignStateAsync(this.fullStateIdForPoint(point), value, false);
        }

        conn.sendAsdu(this.buildAsdu(decoded.typeId, false, COT.ACTIVATION_CONFIRMATION, decoded.commonAddress, decoded.objects));
    }

    async handleCommandResponse(decoded) {
        const typeName = TYPE_NAME[decoded.typeId] || decoded.typeId;
        this.log.debug(`IEC-104 command response received type=${typeName} cot=${decoded.cot} objects=${decoded.objects.length}`);

        if (decoded.cot !== COT.ACTIVATION_CONFIRMATION) return;

        for (const obj of decoded.objects) {
            const point = this.pointsByIoa.get(obj.ioa);
            if (!point) continue;

            const stateId = this.fullStateIdForPoint(point);
            const state = await this.getForeignStateAsync(stateId);
            if (state) await this.setForeignStateAsync(stateId, state.val, true);
        }
    }

    async updatePointFromRemote(typeId, obj, commonAddress) {
        const point = this.pointsByIoa.get(obj.ioa) || {
            enabled: true,
            name: `IOA ${obj.ioa}`,
            ioa: obj.ioa,
            type: TYPE_NAME[typeId] || `TYPE_${typeId}`,
            factor: 1,
            offset: 0,
            stateId: `points.${obj.ioa}`,
            writable: false,
            unit: "",
            commonAddress,
        };

        point.commonAddress = commonAddress;

        if (!this.pointsByIoa.has(obj.ioa)) {
            this.pointsByIoa.set(obj.ioa, point);
            this.pointsByState.set(this.fullStateIdForPoint(point), point);
            this.points.push(point);
            await this.addDiscoveredPointToConfig(point);
            await this.extendObjectAsync(`points.${obj.ioa}`, {
                type: "state",
                common: {
                    name: point.name,
                    type: this.jsTypeForPoint(point),
                    role: this.roleForPoint(point),
                    unit: "",
                    read: true,
                    write: true,
                },
                native: { ioa: obj.ioa, iecType: point.type },
            });
            await this.subscribeForeignStatesAsync(this.fullStateIdForPoint(point));
        }

        const value = this.applyScale(point, this.decodeInformationValue(typeId, obj.data));
        await this.setForeignStateAsync(this.fullStateIdForPoint(point), value, true);
    }

    async addDiscoveredPointToConfig(point) {
        const update = async () => {
            const instanceId = `system.adapter.${this.namespace}`;
            const obj = await this.getForeignObjectAsync(instanceId);
            if (!obj || !obj.native) return;

            const points = Array.isArray(obj.native.points) ? obj.native.points : [];
            if (points.some(existing => Number(existing && existing.ioa) === Number(point.ioa))) return;

            obj.native.points = [
                ...points,
                {
                    enabled: true,
                    name: point.name,
                    ioa: point.ioa,
                    type: TYPE[point.type] ? point.type : "M_ME_NC_1",
                    stateId: point.stateId,
                    writable: point.writable,
                    unit: point.unit,
                    factor: point.factor,
                    offset: point.offset,
                },
            ];

            await this.setForeignObjectAsync(instanceId, obj);
            this.config.points = obj.native.points;
            this.log.debug(`Added discovered IEC-104 data point IOA ${point.ioa} to adapter settings`);
        };

        this.configUpdatePromise = this.configUpdatePromise.then(update, update);
        await this.configUpdatePromise;
    }

    applyScale(point, raw) {
        if (typeof raw !== "number") return raw;
        return raw * point.factor + point.offset;
    }

    removeScale(point, value) {
        const numeric = Number(value || 0);
        return (numeric - point.offset) / point.factor;
    }

    decodeAsdu(asdu) {
        const cfg = this.protocolConfig;
        if (asdu.length < 2 + cfg.cotSize + cfg.commonAddressSize) {
            throw new Error(`ASDU too short: ${asdu.toString("hex")}`);
        }

        let offset = 0;
        const typeId = asdu[offset++];
        const vsq = asdu[offset++];
        const sequence = Boolean(vsq & 0x80);
        const count = vsq & 0x7f;
        const cot = this.readUIntLE(asdu, offset, cfg.cotSize) & 0x3f;
        offset += cfg.cotSize;
        const commonAddress = this.readUIntLE(asdu, offset, cfg.commonAddressSize);
        offset += cfg.commonAddressSize;

        const objects = [];
        if (sequence) {
            const firstIoa = this.readUIntLE(asdu, offset, cfg.ioaSize);
            offset += cfg.ioaSize;
            const size = this.infoElementSize(typeId);
            for (let i = 0; i < count; i++) {
                const end = size < 0 ? asdu.length : offset + size;
                objects.push({ ioa: firstIoa + i, data: asdu.subarray(offset, end) });
                offset = end;
            }
        } else {
            const size = this.infoElementSize(typeId);
            for (let i = 0; i < count; i++) {
                const ioa = this.readUIntLE(asdu, offset, cfg.ioaSize);
                offset += cfg.ioaSize;
                const remainingObjects = count - i - 1;
                const end = size < 0 ? asdu.length : Math.min(asdu.length, offset + size);
                objects.push({ ioa, data: asdu.subarray(offset, end) });
                offset = size < 0 && remainingObjects > 0 ? asdu.length : end;
            }
        }

        this.log.debug(`IEC-104 ASDU rx type=${TYPE_NAME[typeId] || typeId} cot=${cot} ca=${commonAddress} count=${count}`);
        return { typeId, sequence, count, cot, commonAddress, objects };
    }

    buildAsdu(typeId, sequence, cot, commonAddress, objects) {
        const cfg = this.protocolConfig;
        const header = Buffer.alloc(2 + cfg.cotSize + cfg.commonAddressSize);
        let offset = 0;
        header[offset++] = typeId;
        header[offset++] = (sequence ? 0x80 : 0) | (objects.length & 0x7f);
        this.writeUIntLE(header, cot, offset, cfg.cotSize);
        if (cfg.cotSize === 2) header[offset + 1] = cfg.originatorAddress;
        offset += cfg.cotSize;
        this.writeUIntLE(header, commonAddress, offset, cfg.commonAddressSize);

        const parts = [header];
        for (const obj of objects) {
            const ioa = Buffer.alloc(cfg.ioaSize);
            this.writeUIntLE(ioa, obj.ioa, 0, cfg.ioaSize);
            parts.push(ioa, obj.data);
        }
        return Buffer.concat(parts);
    }

    buildSinglePointAsdu(point, value, cot) {
        const outboundType = this.outboundTypeForPoint(point);
        const typeId = TYPE[outboundType] || TYPE.M_ME_NC_1;
        const raw = this.removeScale(point, value);
        return this.buildAsdu(typeId, false, cot, this.commonAddressForPoint(point), [
            { ioa: point.ioa, data: this.encodeInformationValue(typeId, raw) },
        ]);
    }

    buildCommandAsdu(point, value) {
        const commandType = this.commandTypeForPoint(point);
        if (!commandType) return null;

        const typeId = TYPE[commandType];
        const raw = this.removeScale(point, value);
        return this.buildAsdu(typeId, false, COT.ACTIVATION, this.commonAddressForPoint(point), [
            { ioa: point.ioa, data: this.encodeInformationValue(typeId, raw) },
        ]);
    }

    commonAddressForPoint(point) {
        return Number(point.commonAddress || this.protocolConfig.commonAddress);
    }

    outboundTypeForPoint(point) {
        if (this.protocolConfig.mode === "slave" && COMMAND_TO_MONITORING_TYPE[point.type]) {
            return COMMAND_TO_MONITORING_TYPE[point.type];
        }
        return point.type;
    }

    commandTypeForPoint(point) {
        const meta = TYPE_META[point.type];
        if (meta && meta.command) return point.type;
        return MONITORING_TO_COMMAND_TYPE[point.type] || null;
    }

    infoElementSize(typeId) {
        const name = TYPE_NAME[typeId];
        const meta = TYPE_META[name];
        if (meta && meta.variable) return -1;

        switch (meta ? meta.base : name) {
            case "M_SP_NA_1":
            case "M_DP_NA_1":
            case "C_SC_NA_1":
            case "C_DC_NA_1":
            case "C_RC_NA_1":
                return 1 + this.timeSize(meta);
            case "M_ST_NA_1":
                return 2 + this.timeSize(meta);
            case "M_BO_NA_1":
            case "M_PS_NA_1":
            case "M_ME_NC_1":
            case "M_IT_NA_1":
            case "C_SE_NC_1":
            case "C_BO_NA_1":
                return 5 + this.timeSize(meta);
            case "M_ME_NA_1":
            case "M_ME_NB_1":
            case "C_SE_NA_1":
            case "C_SE_NB_1":
                return 3 + this.timeSize(meta);
            case "M_EP_TA_1":
                return meta && meta.time === "cp56" ? 10 : 6;
            case "M_EP_TB_1":
            case "M_EP_TC_1":
                return meta && meta.time === "cp56" ? 11 : 7;
            case "C_IC_NA_1":
            case "C_CI_NA_1":
            case "C_RP_NA_1":
                return 1;
            case "C_RD_NA_1":
                return 0;
            case "C_CS_NA_1":
                return 7;
            case "C_TS_NA_1":
            case "C_CD_NA_1":
                return 2;
            case "F_FR_NA_1":
            case "F_LS_NA_1":
                return 6;
            case "F_SR_NA_1":
                return 7;
            case "F_SC_NA_1":
            case "F_AF_NA_1":
                return 4;
            default:
                return 1;
        }
    }

    decodeInformationValue(typeId, data) {
        const name = TYPE_NAME[typeId];
        const meta = TYPE_META[name];
        switch (meta ? meta.base : name) {
            case "M_SP_NA_1":
                return Boolean(data[0] & 0x01);
            case "M_DP_NA_1":
                return data[0] & 0x03;
            case "M_ST_NA_1":
                return data.readInt8(0);
            case "M_BO_NA_1":
            case "M_PS_NA_1":
                return data.readUInt32LE(0);
            case "M_ME_NA_1":
                return data.readInt16LE(0) / 32767;
            case "M_ME_NB_1":
                return data.readInt16LE(0);
            case "M_ME_NC_1":
                return data.readFloatLE(0);
            case "M_IT_NA_1":
                return data.readInt32LE(0);
            case "M_EP_TA_1":
            case "M_EP_TB_1":
            case "M_EP_TC_1":
                return data[0] || 0;
            case "F_FR_NA_1":
            case "F_SR_NA_1":
            case "F_SC_NA_1":
            case "F_LS_NA_1":
            case "F_AF_NA_1":
            case "F_SG_NA_1":
            case "F_DR_TA_1":
                return data.toString("hex").toUpperCase();
            default:
                return data.length ? data[0] : null;
        }
    }

    encodeInformationValue(typeId, value) {
        const name = TYPE_NAME[typeId];
        const meta = TYPE_META[name];
        const base = meta ? meta.base : name;
        let payload;

        switch (base) {
            case "M_SP_NA_1":
            case "C_SC_NA_1":
                payload = Buffer.from([value ? 1 : 0]);
                break;
            case "M_DP_NA_1":
            case "C_DC_NA_1":
            case "C_RC_NA_1":
                payload = Buffer.from([Number(value || 0) & 0x03]);
                break;
            case "M_ST_NA_1":
                payload = Buffer.from([Number(value || 0) & 0x7f, 0]);
                break;
            case "M_BO_NA_1":
            case "M_PS_NA_1":
            case "C_BO_NA_1": {
                const buf = Buffer.alloc(5);
                buf.writeUInt32LE(Number(value || 0) >>> 0, 0);
                payload = buf;
                break;
            }
            case "M_ME_NA_1":
            case "C_SE_NA_1": {
                const buf = Buffer.alloc(3);
                buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(Number(value || 0) * 32767))), 0);
                payload = buf;
                break;
            }
            case "M_ME_NB_1":
            case "C_SE_NB_1": {
                const buf = Buffer.alloc(3);
                buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(Number(value || 0)))), 0);
                payload = buf;
                break;
            }
            case "M_ME_NC_1":
            case "C_SE_NC_1": {
                const buf = Buffer.alloc(5);
                buf.writeFloatLE(Number(value || 0), 0);
                payload = buf;
                break;
            }
            case "M_IT_NA_1": {
                const buf = Buffer.alloc(5);
                buf.writeInt32LE(Math.round(Number(value || 0)), 0);
                payload = buf;
                break;
            }
            case "M_EP_TA_1":
            case "M_EP_TB_1":
            case "M_EP_TC_1":
                payload = Buffer.from([Number(value || 0) & 0xff, 0, 0]);
                break;
            case "C_IC_NA_1":
                payload = Buffer.from([20]);
                break;
            case "C_CI_NA_1":
            case "C_RP_NA_1":
                payload = Buffer.from([Number(value || 0) & 0xff]);
                break;
            case "C_RD_NA_1":
                payload = Buffer.alloc(0);
                break;
            case "C_CS_NA_1":
                payload = this.encodeCp56Time(new Date());
                break;
            case "C_TS_NA_1":
            case "C_CD_NA_1": {
                const buf = Buffer.alloc(2);
                buf.writeUInt16LE(Number(value || 0) & 0xffff, 0);
                payload = buf;
                break;
            }
            default:
                payload = Buffer.from([Number(value || 0) & 0xff]);
        }

        if (meta && meta.time === "cp24") return Buffer.concat([payload, this.encodeCp24Time(new Date())]);
        if (meta && meta.time === "cp56") return Buffer.concat([payload, this.encodeCp56Time(new Date())]);
        return payload;
    }

    decodeCommandValue(typeId, data) {
        const name = TYPE_NAME[typeId];
        const meta = TYPE_META[name];
        switch (meta ? meta.base : name) {
            case "C_SC_NA_1":
                return Boolean(data[0] & 0x01);
            case "C_DC_NA_1":
            case "C_RC_NA_1":
                return data[0] & 0x03;
            case "C_SE_NA_1":
                return data.readInt16LE(0) / 32767;
            case "C_SE_NB_1":
                return data.readInt16LE(0);
            case "C_SE_NC_1":
                return data.readFloatLE(0);
            case "C_BO_NA_1":
                return data.readUInt32LE(0);
            case "C_CS_NA_1":
                return this.decodeCp56Time(data.subarray(0, 7)).toISOString();
            default:
                return data.length ? data[0] : null;
        }
    }

    timeSize(meta) {
        if (!meta || !meta.time) return 0;
        return meta.time === "cp56" ? 7 : 3;
    }

    encodeCp24Time(date) {
        const buf = Buffer.alloc(3);
        const ms = date.getSeconds() * 1000 + date.getMilliseconds();
        buf.writeUInt16LE(ms, 0);
        buf[2] = date.getMinutes();
        return buf;
    }

    encodeCp56Time(date) {
        const buf = Buffer.alloc(7);
        const ms = date.getSeconds() * 1000 + date.getMilliseconds();
        buf.writeUInt16LE(ms, 0);
        buf[2] = date.getMinutes();
        buf[3] = date.getHours();
        buf[4] = date.getDate();
        buf[5] = date.getMonth() + 1;
        buf[6] = date.getFullYear() - 2000;
        return buf;
    }

    decodeCp56Time(data) {
        if (data.length < 7) return new Date(0);
        const ms = data.readUInt16LE(0);
        const second = Math.floor(ms / 1000);
        const milli = ms % 1000;
        const minute = data[2] & 0x3f;
        const hour = data[3] & 0x1f;
        const day = data[4] & 0x1f;
        const month = (data[5] & 0x0f) - 1;
        const year = 2000 + (data[6] & 0x7f);
        return new Date(year, month, day, hour, minute, second, milli);
    }

    readUIntLE(buf, offset, size) {
        let value = 0;
        for (let i = 0; i < size; i++) value |= (buf[offset + i] || 0) << (8 * i);
        return value >>> 0;
    }

    writeUIntLE(buf, value, offset, size) {
        for (let i = 0; i < size; i++) buf[offset + i] = (value >> (8 * i)) & 0xff;
    }
}

if (require.main !== module) {
    module.exports = options => new Iec104Adapter(options);
} else {
    new Iec104Adapter();
}
