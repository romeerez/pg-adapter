"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterBase = void 0;
const net_1 = require("net");
const types_1 = require("../types");
const task_1 = require("./task");
const sql_1 = require("./sql");
const log_1 = require("./log");
class AdapterBase {
    constructor({ pool, decodeTypes, log }) {
        this.sockets = new Array(pool).fill(null).map(() => new net_1.Socket({ readable: true, writable: true }));
        this.decodeTypes = decodeTypes;
        if (log === true)
            this.log = log_1.defaultLog;
        else if (log === false)
            this.log = log_1.noopLog;
        else
            this.log = log;
    }
    connect() { }
    performQuery(mode, query, args, prepared) {
        this.connect();
        return new Promise(async (resolve, reject) => {
            if (query.then)
                query = await query;
            const error = new Error();
            const task = task_1.createTask({
                mode, error, resolve, reject, prepared,
                adapter: this,
                query: sql_1.sql2(query, args),
                decodeTypes: this.decodeTypes,
            });
            task_1.addTaskToAdapter(this, task);
        });
    }
    query(sql, ...args) {
        return this.performQuery(types_1.ResultMode.objects, sql, args);
    }
    objects(sql, ...args) {
        return this.performQuery(types_1.ResultMode.objects, sql, args);
    }
    arrays(sql, ...args) {
        return this.performQuery(types_1.ResultMode.arrays, sql, args);
    }
    value(sql, ...args) {
        return this.performQuery(types_1.ResultMode.value, sql, args);
    }
    exec(sql, ...args) {
        return this.performQuery(types_1.ResultMode.skip, sql, args);
    }
}
exports.AdapterBase = AdapterBase;
