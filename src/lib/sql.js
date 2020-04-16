"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quote_1 = require("lib/quote");
const process = (parts, args) => {
    if (typeof parts === 'string')
        return parts;
    const result = new Array(parts.length + args.length);
    const last = parts.length - 1;
    parts.forEach((part, i) => {
        if (i === 0)
            part = part.trimLeft();
        if (i === last)
            part = part.trimRight();
        const arg = args[i];
        result.push(part, arg && quote_1.quote(args[i]));
    });
    return result.join('');
};
exports.sql = (parts, ...args) => process(parts, args);
exports.sql2 = (parts, args) => typeof parts === 'string' ? parts : process(parts, args);
