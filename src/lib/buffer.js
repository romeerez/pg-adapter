"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeInt32 = (buf, i, n) => {
    buf[i] = n >> 24 & 0xff;
    buf[i + 1] = n >> 16 & 0xff;
    buf[i + 2] = n >> 8 & 0xff;
    buf[i + 3] = n & 0xff;
};
exports.decodeInt32 = (data, i) => data[i + 3] + (data[i + 2] << 8) + (data[i + 1] << 16) + (data[i] << 24);
exports.decodeInt16 = (data, i) => data[i + 1] + (data[i] << 8);
exports.getMessageLength = (data, pos) => exports.decodeInt32(data, pos + 1);
exports.skipMessage = (data, pos) => pos + exports.getMessageLength(data, pos) + 1;
exports.noop = () => { };
exports.throwError = (err) => { throw err; };
exports.getMessage = (data, pos = 0, offset = 0) => data.slice(pos + offset + 5, exports.getMessageLength(data, pos) + 1);
