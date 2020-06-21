"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeListener = exports.handleMessage = void 0;
const buffer_1 = require("./buffer");
const auth_1 = require("./handlers/auth");
const complete_1 = require("./handlers/complete");
const error_1 = require("./handlers/error");
const parseDescription_1 = require("./handlers/parseDescription");
const parseRow_1 = require("./handlers/parseRow");
var codes;
(function (codes) {
    codes[codes["authenticationCode"] = 'R'.charCodeAt(0)] = "authenticationCode";
    codes[codes["backendKeyDataCode"] = 'K'.charCodeAt(0)] = "backendKeyDataCode";
    codes[codes["parameterStatusCode"] = 'S'.charCodeAt(0)] = "parameterStatusCode";
    codes[codes["readyForQueryCode"] = 'Z'.charCodeAt(0)] = "readyForQueryCode";
    codes[codes["rowDescriptionCode"] = 'T'.charCodeAt(0)] = "rowDescriptionCode";
    codes[codes["dataRowCode"] = 'D'.charCodeAt(0)] = "dataRowCode";
    codes[codes["commandCompleteCode"] = 'C'.charCodeAt(0)] = "commandCompleteCode";
    codes[codes["errorResponseCode"] = 'E'.charCodeAt(0)] = "errorResponseCode";
    codes[codes["noticeResponseCode"] = 'N'.charCodeAt(0)] = "noticeResponseCode";
    codes[codes["bindCode"] = 'B'.charCodeAt(0)] = "bindCode";
    codes[codes["parseCompleteCode"] = '1'.charCodeAt(0)] = "parseCompleteCode";
    codes[codes["bindCompleteCode"] = '2'.charCodeAt(0)] = "bindCompleteCode";
    codes[codes["closeCompleteCode"] = '3'.charCodeAt(0)] = "closeCompleteCode";
    codes[codes["copyDataCode"] = 'd'.charCodeAt(0)] = "copyDataCode";
    codes[codes["copyDoneCode"] = 'c'.charCodeAt(0)] = "copyDoneCode";
    codes[codes["copyFailCode"] = 'f'.charCodeAt(0)] = "copyFailCode";
    codes[codes["copyInResponseCode"] = 'G'.charCodeAt(0)] = "copyInResponseCode";
    codes[codes["copyOutResponseCode"] = 'H'.charCodeAt(0)] = "copyOutResponseCode";
    codes[codes["copyBothResponseCode"] = 'W'.charCodeAt(0)] = "copyBothResponseCode";
    codes[codes["functionCallResponseCode"] = 'V'.charCodeAt(0)] = "functionCallResponseCode";
    codes[codes["negotiateProtocolVersionCode"] = 'v'.charCodeAt(0)] = "negotiateProtocolVersionCode";
    codes[codes["noDataCode"] = 'n'.charCodeAt(0)] = "noDataCode";
    codes[codes["notificationResponseCode"] = 'A'.charCodeAt(0)] = "notificationResponseCode";
    codes[codes["emptyQueryResponseCode"] = 'I'.charCodeAt(0)] = "emptyQueryResponseCode";
    codes[codes["parameterDescriptionCode"] = 't'.charCodeAt(0)] = "parameterDescriptionCode";
    codes[codes["portalSuspendedCode"] = 's'.charCodeAt(0)] = "portalSuspendedCode";
})(codes || (codes = {}));
const copy = (message, data, dataPos) => data.copy(message.buffer, message.cutMessageAllocated, dataPos);
const listener = (socket, message, creds, data, size = data.length) => {
    let pos = 0;
    let len = message.cutMessageLength;
    if (len !== 0) {
        if (len > message.cutMessageAllocated + data.length) {
            copy(message, data, 0);
            message.cutMessageAllocated += data.length;
            return;
        }
        const copySize = len - message.cutMessageAllocated;
        copy(message, data, 0);
        message.cutMessageLength = 0;
        message.cutMessageAllocated = 0;
        listener(socket, message, creds, message.buffer, len);
        pos = copySize + 1;
    }
    len = buffer_1.getMessageLength(data, pos);
    const task = socket.task;
    while (pos < size) {
        if (pos + len > size) {
            if (message.buffer.length < len)
                message.buffer = Buffer.alloc(len + 1, message.buffer);
            copy(message, data, pos);
            message.cutMessageAllocated = size - pos;
            message.cutMessageLength = len;
            break;
        }
        const code = data[pos];
        if (code === codes.dataRowCode) {
            parseRow_1.parseRow(socket, task, data, pos);
        }
        else if (code === codes.rowDescriptionCode) {
            parseDescription_1.parseDescription(socket, task, data, pos);
        }
        else if (code === codes.readyForQueryCode) {
            return task.finish(socket, task);
        }
        else if (code === codes.errorResponseCode || code === codes.noticeResponseCode) {
            const { level } = error_1.parseError(task, data, pos);
            if (level !== 'ERROR')
                return task.finish(socket, task);
        }
        else if (code === codes.authenticationCode) {
            auth_1.auth(socket, task, creds, data, pos);
        }
        else if (code === codes.commandCompleteCode) {
            complete_1.complete(task);
        }
        else {
            if (code !== codes.parameterStatusCode &&
                code !== codes.backendKeyDataCode) {
                console.warn(`Handling of ${String.fromCharCode(code)} code is not implemented yet`);
            }
        }
        pos = buffer_1.skipMessage(data, pos);
        len = buffer_1.getMessageLength(data, pos);
    }
};
exports.handleMessage = (socket, creds) => {
    const message = {
        buffer: Buffer.alloc(10000),
        cutMessageLength: 0,
        cutMessageAllocated: 0,
    };
    socket.dataListener = (data) => listener(socket, message, creds, data);
    socket.on('data', socket.dataListener);
};
exports.removeListener = (socket) => {
    if (socket.dataListener) {
        socket.removeListener('data', socket.dataListener);
        delete socket.dataListener;
    }
};
