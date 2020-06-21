"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.wrapperTransaction = exports.transaction = void 0;
const adapterBase_1 = require("./adapterBase");
const task_1 = require("./task");
const types_1 = require("../types");
const noop = () => { };
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
    const t = new Transaction(adapter, error);
    const promises = [t.promise];
    if (fn)
        promises.push(applyFn(t, fn));
    return Promise.all(promises);
};
exports.wrapperTransaction = (adapter, error, target, fn) => {
    const t = new Transaction(adapter, error);
    const promises = [t.promise];
    const proxy = new Proxy(t, {
        get: (t, name) => t[name] || target[name]
    });
    if (fn)
        promises.push(applyFn(proxy, fn));
    return Promise.all(promises);
};
class Transaction extends adapterBase_1.AdapterBase {
    constructor(adapter, error) {
        super({ pool: 0, decodeTypes: adapter.decodeTypes, log: adapter.log });
        this.failed = false;
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
            let error = this.failed ? this.error : task.failed && task.error;
            error ? task.reject(error) : task.resolve(error);
            transaction.sockets.length = 0;
            transaction.task = task.next;
            transaction.adapter.sockets.push(socket);
            if (transaction.adapter.lastTask === task)
                transaction.adapter.lastTask = undefined;
            socket.task = undefined;
            task_1.next(transaction.adapter, socket);
        };
        this.catch = (err) => {
            if (this.failed)
                return;
            this.error = err;
            this.failed = true;
        };
        this.adapter = adapter;
        this.error = error;
        this.resolve = noop;
        this.reject = noop;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.adapter.connect();
        const task = task_1.createTask({
            adapter: this.adapter,
            error: this.error,
            resolve: noop,
            reject: noop,
            decodeTypes: this.adapter.decodeTypes,
            mode: types_1.ResultMode.skip,
            query: queries.begin,
            finish: this.afterBegin,
        });
        task_1.addTaskToAdapter(this.adapter, task);
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
    end(query = queries.commit, err) {
        const task = task_1.createTask({
            query,
            adapter: this,
            error: err || this.error,
            resolve: this.resolve,
            reject: this.reject,
            finish: this.finish,
            decodeTypes: this.adapter.decodeTypes,
            mode: types_1.ResultMode.skip,
        });
        task_1.addTaskToAdapter(this, task);
        return this;
    }
    performQuery(mode, query, args, prepared) {
        const promise = super.performQuery(mode, query, args, prepared);
        promise.catch(this.catch);
        return promise;
    }
    then(...args) {
        this.promise.then(...args);
    }
}
exports.Transaction = Transaction;
