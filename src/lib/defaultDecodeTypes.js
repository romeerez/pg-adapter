"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trueCode = 'T'.charCodeAt(0);
const toInt = (value, pos, size) => parseInt(value.toString(undefined, pos, pos + size));
const toFloat = (value, pos, size) => parseFloat(value.toString(undefined, pos, pos + size));
const toIntFromBinary = (value, pos, size) => parseInt(value.toString(undefined, pos, pos + size), 2);
const toBoolean = (value) => value[0] === trueCode;
const toDate = (value, pos, size) => new Date(value.toString(undefined, pos, pos + size));
exports.defaultDecodeTypes = {
    20: toInt,
    21: toInt,
    23: toInt,
    700: toFloat,
    701: toFloat,
    1700: toFloat,
    1560: toIntFromBinary,
    1562: toIntFromBinary,
    16: toBoolean,
    1082: toDate,
    1114: toDate,
    1184: toDate,
};
