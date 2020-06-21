"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_1 = require("../src/adapter");
const date = new Date();
date.setUTCFullYear(2020);
date.setUTCMonth(0);
date.setUTCDate(1);
date.setUTCHours(2);
date.setUTCMinutes(3);
date.setUTCSeconds(4);
date.setUTCMilliseconds(567);
describe('quote', () => {
    it('can quote number', () => {
        expect(adapter_1.quote(123)).toBe('123');
    });
    it('can quote string', () => {
        expect(adapter_1.quote('string')).toBe(`'string'`);
    });
    it('can quote boolean', () => {
        expect(adapter_1.quote(true)).toBe(`true`);
        expect(adapter_1.quote(false)).toBe(`false`);
    });
    it('can quote null and undefined', () => {
        expect(adapter_1.quote(null)).toBe(`NULL`);
        expect(adapter_1.quote(undefined)).toBe(`NULL`);
    });
    it('can quote date', () => {
        expect(adapter_1.quote(date)).toBe(`'2020-01-01T02:03:04.567Z'`);
    });
    it('can stringify JSON', () => {
        expect(adapter_1.quote({ key: `val"ue` })).toBe(`'{"key":"val\\"ue"}'`);
    });
    it('can quote array', () => {
        expect(adapter_1.quote([1, 'string', true, date, { key: `val'"ue` }])).toBe(`'{1,"string",true,"2020-01-01T02:03:04.567Z","{\\"key\\":\\"val''\\\\"ue\\"}"}'`);
    });
});
