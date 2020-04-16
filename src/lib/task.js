"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("lib/buffer");
const finishTask = (socket, task) => {
    const { adapter } = task;
    const { prepared } = task;
    const prepareReady = prepared && !socket.prepared[prepared.name];
    if (!prepareReady)
        adapter.log.finish(socket, task);
    if (task.failed)
        task.reject(task.error);
    else if (!prepareReady)
        task.resolve(task.result);
    socket.task = undefined;
    if (prepareReady && !task.failed) {
        socket.prepared[prepared.name] = true;
        if (adapter.task)
            task.next = adapter.task;
        else
            adapter.lastTask = task;
        adapter.task = task;
        task.parseInfo.resultNumber = 0;
    }
    else if (adapter.lastTask === task) {
        adapter.lastTask = undefined;
    }
    exports.next(adapter, socket);
};
exports.createTask = ({ adapter, mode, query, error, decodeTypes, prepared, resolve, reject, finish = finishTask }) => ({
    adapter, mode, query, error, decodeTypes, prepared, resolve, reject, finish,
    parseInfo: {
        resultNumber: 0,
        skipNextValues: false
    }
});
exports.addTaskToAdapter = (adapter, task) => {
    if (adapter.task) {
        adapter.lastTask.next = task;
        adapter.lastTask = task;
    }
    else {
        adapter.task = task;
        adapter.lastTask = task;
        for (let socket of adapter.sockets) {
            if (!socket.task) {
                exports.next(adapter, socket);
                return;
            }
        }
    }
};
const queryCode = 'Q'.charCodeAt(0);
exports.next = (adapter, socket) => {
    const { task } = adapter;
    if (!task)
        return;
    socket.task = task;
    adapter.task = task.next;
    let query;
    if (!task.prepared || socket.prepared[task.prepared.name])
        query = task.query;
    else
        query = task.prepared.sql;
    const len = query.length + 5;
    const buffer = Buffer.alloc(len + 1);
    buffer[0] = queryCode;
    buffer_1.encodeInt32(buffer, 1, len);
    buffer.fill(query, 5);
    buffer[len] = 0;
    adapter.log.start(socket, task);
    socket.write(buffer);
};
