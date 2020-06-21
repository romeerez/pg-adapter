"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quote = void 0;
const singleQuoteRegex = /'/g;
const doubleQuoteRegex = /"/g;
const quoteValue = ((value) => {
    const type = typeof value;
    if (type === 'number')
        return value;
    else if (type === 'string')
        return `"${value.replace(doubleQuoteRegex, '\\"').replace(singleQuoteRegex, "''")}"`;
    else if (type === 'boolean')
        return value ? 'true' : 'false';
    else if (value instanceof Date)
        return `"${value.toISOString()}"`;
    else if (Array.isArray(value))
        return quoteArray(value);
    else if (type === null || type === undefined)
        return 'NULL';
    else
        return `"${JSON.stringify(value).replace(doubleQuoteRegex, '\\"').replace(singleQuoteRegex, "''")}"`;
});
const quoteArray = (array) => `'{${array.map(quoteValue).join(',')}}'`;
exports.quote = ((value) => {
    const type = typeof value;
    if (type === 'number')
        return `${value}`;
    else if (type === 'string')
        return `'${value.replace(singleQuoteRegex, "''")}'`;
    else if (type === 'boolean')
        return value ? 'true' : 'false';
    else if (value instanceof Date)
        return `'${value.toISOString()}'`;
    else if (Array.isArray(value))
        return quoteArray(value);
    else if (value === null || value === undefined)
        return 'NULL';
    else
        return `'${JSON.stringify(value).replace(singleQuoteRegex, "''")}'`;
});
