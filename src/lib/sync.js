"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sync = ({ lastTask: last }) => {
    if (!last)
        return;
    const { finish } = last;
    return new Promise(resolve => {
        last.finish = (socket, task) => {
            finish(socket, task);
            resolve();
        };
    });
};
