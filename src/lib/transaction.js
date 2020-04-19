"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapterBase_1 = require("./adapterBase");
const task_1 = require("./task");
const types_1 = require("../types");
const buffer_1 = require("./buffer");
var queries;
(function (queries) {
    queries["begin"] = "BEGIN";
    queries["commit"] = "COMMIT";
    queries["rollback"] = "ROLLBACK";
})(queries || (queries = {}));
const applyFn = async (t, fn) => {
    await fn(t);
    t.commit();
};
exports.transaction = (adapter, error, fn) => {
    const t = new Transaction(adapter, error).start();
    if (fn)
        applyFn(t, fn);
    return t;
};
exports.wrapperTransaction = (adapter, error, target, fn) => {
    const t = new Transaction(adapter, error).start();
    const proxy = new Proxy(t, {
        get: (t, name) => t[name] || target[name]
    });
    if (fn)
        applyFn(proxy, fn);
    return proxy;
};
class Transaction extends adapterBase_1.AdapterBase {
    constructor(adapter, error) {
        super({ pool: 0, decodeTypes: adapter.decodeTypes, log: adapter.log });
        this.afterBegin = (socket, task) => {
            const { adapter } = task;
            adapter.log.finish(socket, task);
            const index = adapter.sockets.indexOf(socket);
            adapter.sockets.splice(index, 1);
            this.sockets[0] = socket;
            if (adapter.lastTask === task)
                adapter.lastTask = undefined;
            socket.task = undefined;
            task_1.next(this, socket);
        };
        this.finish = (socket, task) => {
            const transaction = task.adapter;
            transaction.log.finish(socket, task);
            task.failed ? task.reject(task.error) : task.resolve();
            transaction.sockets.length = 0;
            transaction.task = task.next;
            transaction.adapter.sockets.push(socket);
            if (transaction.adapter.lastTask === task)
                transaction.adapter.lastTask = undefined;
            socket.task = undefined;
            task_1.next(transaction.adapter, socket);
        };
        this.adapter = adapter;
        this.error = error;
        this.resolve = buffer_1.noop;
        this.reject = buffer_1.noop;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    start() {
        this.adapter.connect();
        const task = task_1.createTask({
            adapter: this.adapter,
            error: this.error,
            resolve: buffer_1.noop,
            reject: buffer_1.noop,
            decodeTypes: this.adapter.decodeTypes,
            mode: types_1.ResultMode.skip,
            query: queries.begin,
            finish: this.afterBegin,
        });
        task_1.addTaskToAdapter(this.adapter, task);
        return this;
    }
    transaction() {
        const error = new Error();
        return exports.transaction(this, error);
    }
    commit() {
        return this.end(queries.commit);
    }
    rollback() {
        return this.end(queries.rollback);
    }
    end(query = queries.commit) {
        const task = task_1.createTask({
            query,
            adapter: this,
            error: this.error,
            resolve: this.resolve,
            reject: this.reject,
            finish: this.finish,
            decodeTypes: this.adapter.decodeTypes,
            mode: types_1.ResultMode.skip,
        });
        task_1.addTaskToAdapter(this, task);
        return this;
    }
    then(...args) {
        this.promise.then(...args);
    }
}
exports.Transaction = Transaction;
