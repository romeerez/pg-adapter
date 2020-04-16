"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("lib/buffer");
const types_1 = require("types");
exports.parseDescription = (socket, request, data, pos) => {
    let result;
    const mode = request.mode;
    const { parseInfo } = request;
    if (mode !== types_1.ResultMode.skip) {
        const columnsCount = buffer_1.decodeInt16(data, pos + 5);
        if (mode === types_1.ResultMode.value) {
            const to = data.indexOf('\0', pos + 7);
            parseInfo.type = buffer_1.decodeInt32(data, to + 7);
        }
        else {
            pos += 7;
            const names = new Array(columnsCount);
            const types = new Uint32Array(columnsCount);
            for (let c = 0; c < columnsCount; c++) {
                const to = data.indexOf('\0', pos);
                names[c] = String(data.slice(pos, to));
                pos = to + 7;
                types[c] = buffer_1.decodeInt32(data, pos);
                pos += 12;
            }
            parseInfo.names = names;
            parseInfo.types = types;
            result = [];
        }
        parseInfo.columnsCount = columnsCount;
    }
    const { resultNumber } = parseInfo;
    if (resultNumber === 0)
        request.result = result;
    else if (resultNumber === 1)
        request.result = [request.result, result];
    else
        request.result[resultNumber] = result;
};
