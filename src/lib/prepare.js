"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepare = void 0;
const types_1 = require("../types");
const sql_1 = require("./sql");
const quote_1 = require("./quote");
exports.prepare = (adapter, name, ...args) => {
    return (prepareTemplate, prepareArgs) => {
        const arr = ['PREPARE ', name];
        if (args.length)
            arr.push(`(${args.join(', ')})`);
        arr.push(' AS ');
        const last = prepareTemplate.length - 1;
        prepareTemplate.forEach((part, i) => {
            if (i === 0)
                part = part.trimLeft();
            if (i === last)
                part = part.trimRight();
            arr.push(part, prepareArgs && prepareArgs[i]);
        });
        const prepared = Object.create(adapter);
        prepared.sql = arr.join('');
        prepared.name = name;
        prepared.performQuery = (mode, args) => {
            let sql = `EXECUTE ${name}`;
            if (args && args.length) {
                const parts = args[0];
                if (parts.raw)
                    sql += `(${sql_1.sql2(parts, args.slice(1))})`;
                else
                    sql += `(${args.map(quote_1.quote).join(', ')})`;
            }
            return adapter.performQuery(mode, sql, undefined, prepared);
        };
        prepared.objects = (...args) => prepared.performQuery(types_1.ResultMode.objects, args);
        prepared.arrays = (...args) => prepared.performQuery(types_1.ResultMode.arrays, args);
        prepared.value = (...args) => prepared.performQuery(types_1.ResultMode.value, args);
        prepared.exec = (...args) => prepared.performQuery(types_1.ResultMode.skip, args);
        prepared.query = prepared.objects;
        return new Proxy(adapter, {
            get: (target, name) => prepared[name] || adapter[name]
        });
    };
};
