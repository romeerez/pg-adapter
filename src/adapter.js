"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Adapter = exports.ResultMode = exports.AdapterBase = exports.Transaction = void 0;
const types_1 = require("./types");
Object.defineProperty(exports, "ResultMode", { enumerable: true, get: function () { return types_1.ResultMode; } });
const parseUrl_1 = require("./lib/parseUrl");
const connect_1 = require("./lib/connect");
const sync_1 = require("./lib/sync");
const close_1 = require("./lib/close");
const defaultDecodeTypes_1 = require("./lib/defaultDecodeTypes");
const adapterBase_1 = require("./lib/adapterBase");
Object.defineProperty(exports, "AdapterBase", { enumerable: true, get: function () { return adapterBase_1.AdapterBase; } });
const transaction_1 = require("./lib/transaction");
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return transaction_1.Transaction; } });
const log_1 = require("./lib/log");
const prepare_1 = require("./lib/prepare");
var quote_1 = require("./lib/quote");
Object.defineProperty(exports, "quote", { enumerable: true, get: function () { return quote_1.quote; } });
var sql_1 = require("./lib/sql");
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return sql_1.sql; } });
var parseUrl_2 = require("./lib/parseUrl");
Object.defineProperty(exports, "parseUrl", { enumerable: true, get: function () { return parseUrl_2.parseUrl; } });
class Adapter extends adapterBase_1.AdapterBase {
    constructor({ host = '127.0.0.1', port = 5432, database = 'postgres', user = process.env.USER || 'postgres', password = '', pool = 10, log = Adapter.defaultLog, decodeTypes, } = {}) {
        super({ pool, decodeTypes: decodeTypes || defaultDecodeTypes_1.defaultDecodeTypes, log });
        this.connected = false;
        this.sync = () => sync_1.sync(this);
        this.close = () => close_1.close(this);
        this.connectionSettings = {
            host, port, database, user, password
        };
        this.pool = pool;
    }
    static fromURL(urlOrOptions, options) {
        if (typeof urlOrOptions === 'object')
            return new this({ ...parseUrl_1.parseUrl(process.env.DATABASE_URL), ...urlOrOptions });
        else
            return new this({ ...parseUrl_1.parseUrl(urlOrOptions), ...options });
    }
    async connect() {
        if (this.connected)
            return;
        this.connected = true;
        const promises = [];
        for (let i = 0; i < this.pool; i++)
            promises.push(connect_1.connect(this, this.sockets[i], this.connectionSettings));
        this.sockets = await Promise.all(promises);
    }
    transaction(fn) {
        const error = new Error();
        return transaction_1.transaction(this, error, fn);
    }
    wrapperTransaction(target, fn) {
        const error = new Error();
        return transaction_1.wrapperTransaction(this, error, target, fn);
    }
    prepare(name, ...args) {
        return prepare_1.prepare(this, name, ...args);
    }
}
exports.Adapter = Adapter;
Adapter.defaultLog = log_1.defaultLog;
