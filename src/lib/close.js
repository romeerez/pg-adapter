"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = void 0;
const messageHandler_1 = require("./messageHandler");
exports.close = async (adapter) => {
    await adapter.sync();
    adapter.connected = false;
    for (let socket of adapter.sockets) {
        socket.destroy();
        messageHandler_1.removeListener(socket);
    }
};
