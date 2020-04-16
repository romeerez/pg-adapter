"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("lib/buffer");
const types_1 = require("types");
exports.parseRow = (socket, task, data, pos) => {
    const { mode, parseInfo } = task;
    if (mode === types_1.ResultMode.skip || parseInfo.skipNextValues)
        return;
    pos += 7;
    let row;
    if (mode === types_1.ResultMode.objects)
        row = parseObjects(parseInfo.columnsCount, task.decodeTypes, parseInfo.types, parseInfo.names, data, pos);
    else if (mode === types_1.ResultMode.arrays)
        row = parseArrays(parseInfo.columnsCount, task.decodeTypes, parseInfo.types, parseInfo.names, data, pos);
    else if (mode === types_1.ResultMode.value)
        return parseValue(parseInfo.columnsCount, task.decodeTypes, parseInfo.type, task, data, pos);
    if (parseInfo.resultNumber === 0)
        task.result.push(row);
    else
        task.result[parseInfo.resultNumber].push(row);
};
const parseObjects = (columnsCount, decodeTypes, types, names, data, pos) => {
    const row = {};
    for (let c = 0; c < (columnsCount); c++) {
        const size = buffer_1.decodeInt32(data, pos);
        pos += 4;
        let value;
        if (size === -1) {
            value = null;
        }
        else {
            const decode = decodeTypes[types[c]];
            if (decode)
                value = decode(data, pos, size);
            else
                value = data.toString('utf8', pos, pos + size);
            pos += size;
        }
        row[names[c]] = value;
    }
    return row;
};
const parseArrays = (columnsCount, decodeTypes, types, names, data, pos) => {
    const row = new Array(columnsCount);
    for (let c = 0; c < columnsCount; c++) {
        const size = buffer_1.decodeInt32(data, pos);
        pos += 4;
        let value;
        if (size === -1) {
            value = null;
        }
        else {
            const decode = decodeTypes[types[c]];
            if (decode)
                value = decode(data, pos, size);
            else
                value = data.toString('utf8', pos, pos + size);
            pos += size;
        }
        row[c] = value;
    }
    return row;
};
const parseValue = (columnsCount, decodeTypes, type, task, data, pos) => {
    for (let c = 0; c < columnsCount; c++) {
        const size = buffer_1.decodeInt32(data, pos);
        pos += 4;
        let value;
        if (size === -1) {
            value = null;
        }
        else {
            const decode = decodeTypes[type];
            if (decode)
                value = decode(data, pos, size);
            else
                value = data.toString('utf8', pos, pos + size);
            pos += size;
        }
        if (task.parseInfo.resultNumber === 0)
            task.result = value;
        else
            task.result[task.parseInfo.resultNumber] = value;
        task.parseInfo.skipNextValues = true;
        return;
    }
};
