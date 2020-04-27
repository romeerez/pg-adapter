"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("net");
const tls_1 = __importDefault(require("tls"));
const types_1 = require("../types");
const buffer_1 = require("./buffer");
const messageHandler_1 = require("./messageHandler");
const task_1 = require("./task");
const checkSSLMessage = Buffer.alloc(8);
buffer_1.encodeInt32(checkSSLMessage, 0, 8);
buffer_1.encodeInt32(checkSSLMessage, 4, 80877103);
const SSLCode = 'S'.charCodeAt(0);
const versionBuf = Buffer.alloc(4);
buffer_1.encodeInt32(versionBuf, 0, 196608);
class Connect {
    constructor(adapter, socket, settings) {
        this.adapter = adapter;
        this.socket = socket;
        this.settings = settings;
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.socket.prepared = {};
            this.addTask(resolve, reject);
            this.socketConnect().then(() => this.checkSSL());
        });
    }
    addTask(resolve, reject) {
        const { adapter } = this;
        const error = new Error();
        const task = task_1.createTask({
            adapter, error, resolve, reject,
            mode: types_1.ResultMode.skip,
            query: 'Startup message',
            decodeTypes: {},
            finish: this.finish
        });
        this.task = task;
        this.socket.task = task;
    }
    socketConnect() {
        const { port, host } = this.settings;
        return new Promise(resolve => this.socket.connect(port, host, resolve));
    }
    checkSSL() {
        this.socket.write(checkSSLMessage);
        const listener = (data) => {
            this.sslResponseHandler(data, listener);
        };
        this.socket.on('data', listener);
    }
    sslResponseHandler(data, listener) {
        const { socket, settings: { host } } = this;
        socket.removeListener('data', listener);
        const code = data[0];
        if (code === SSLCode) {
            const options = {
                socket,
                checkServerIdentity: tls_1.default.checkServerIdentity,
                rejectUnauthorized: false,
                servername: net_1.isIP(host) === 0 ? host : undefined
            };
            const { task } = this.socket;
            this.socket = tls_1.default.connect(options, () => this.sendStartupMessage());
            this.socket.task = task;
            this.socket.prepared = {};
        }
        else {
            this.sendStartupMessage();
        }
    }
    sendStartupMessage() {
        const { socket } = this;
        messageHandler_1.handleMessage(socket, this.settings);
        const { user, database } = this.settings;
        const message = `user\0${user}\0database\0${database}\0\0`;
        const len = 8 + Buffer.byteLength(message);
        const buf = Buffer.alloc(len);
        buffer_1.encodeInt32(buf, 0, len);
        versionBuf.copy(buf, 4);
        buf.fill(message, 8);
        socket.write(buf);
    }
    finish(socket, task) {
        socket.task = undefined;
        if (task.failed)
            task.reject(task.error);
        else {
            task.resolve(socket);
            task_1.next(task.adapter, socket);
        }
    }
}
exports.connect = (adapter, socket, settings) => new Connect(adapter, socket, settings).connect();
