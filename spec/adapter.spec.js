"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_1 = require("../src/adapter");
const types_1 = require("../src/types");
const log_1 = require("../src/lib/log");
adapter_1.Adapter.defaultLog = false;
describe('Adapter', () => {
    describe('constructor', () => {
        beforeAll(() => {
            adapter_1.Adapter.defaultLog = true;
        });
        afterAll(() => {
            adapter_1.Adapter.defaultLog = false;
        });
        it('accepts connection settings, pool and log', () => {
            const connectionSettings = {
                host: 'host',
                port: 1234,
                database: 'dbname',
                user: 'user',
                password: 'password',
            };
            const adapter = new adapter_1.Adapter({ ...connectionSettings, pool: 123, log: false });
            expect(adapter.connectionSettings).toMatchObject(connectionSettings);
            expect(adapter.pool).toEqual(123);
            expect(adapter.log).toEqual(log_1.noopLog);
        });
        it('has default values', () => {
            const a1 = new adapter_1.Adapter({});
            const a2 = new adapter_1.Adapter();
            [a1, a2].forEach(a => {
                expect(a.connectionSettings).toMatchObject({
                    host: '127.0.0.1',
                    port: 5432,
                    database: 'postgres',
                    user: process.env.USER || 'postgres',
                    password: '',
                });
                expect(a.pool).toEqual(10);
                expect(a.log).toEqual(log_1.defaultLog);
            });
        });
    });
    describe('fromURL', () => {
        let envDbUrl;
        beforeAll(() => {
            envDbUrl = process.env.DATABASE_URL;
        });
        afterAll(() => {
            process.env.DATABASE_URL = envDbUrl;
        });
        it('initialize Adapter using string url', () => {
            process.env.DATABASE_URL = undefined;
            expect(() => adapter_1.Adapter.fromURL()).toThrow();
            const config = {
                user: 'user',
                password: 'password',
                host: 'host.com',
                port: 1234,
                database: 'database',
            };
            const url = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
            process.env.DATABASE_URL = url;
            expect(adapter_1.Adapter.fromURL().connectionSettings).toMatchObject(config);
            process.env.DATABASE_URL = undefined;
            expect(adapter_1.Adapter.fromURL(url).connectionSettings).toMatchObject(config);
        });
    });
    describe('connect', () => {
        it('connects sockets', async () => {
            // for change with ssl mode on/off edit /usr/local/var/postgres/postgresql.conf
            // instead of creating own certificate you can test it over heroku database
            // to check scram-sha-256 need to set password_encryption = 'scram-sha-256' in postgresql.conf
            // and scram-sha-256 in pg_hba.conf
            expect(async () => {
                const db = adapter_1.Adapter.fromURL({ pool: 1 });
                await db.connect();
                await db.close();
            }).not.toThrow();
        });
    });
    describe('performQuery', () => {
        it('works after connect', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            await db.connect();
            const result = await db.performQuery(types_1.ResultMode.value, 'SELECT 1');
            expect(result).toEqual(1);
            await db.close();
        });
        it('connects automatically', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const result = await db.performQuery(types_1.ResultMode.value, 'SELECT 1');
            expect(result).toEqual(1);
            await db.close();
        });
        it('accept Promise with sql', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const result = await db.performQuery(types_1.ResultMode.value, Promise.resolve('SELECT 1'));
            expect(result).toEqual(1);
            await db.close();
        });
        it('can perform multiple queries in queue', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const results = await Promise.all([
                db.performQuery(types_1.ResultMode.value, 'SELECT 1'),
                db.performQuery(types_1.ResultMode.value, 'SELECT 2'),
                db.performQuery(types_1.ResultMode.value, 'SELECT 3'),
                db.performQuery(types_1.ResultMode.value, 'SELECT 4'),
                db.performQuery(types_1.ResultMode.value, 'SELECT 5'),
            ]);
            expect(results).toEqual([1, 2, 3, 4, 5]);
            await db.close();
        });
        it('can load wide table data', async () => {
            const date = Date.UTC(2020, 0, 1);
            let values = [
                // {sql: 'null', value: null},
                // {sql: '1', value: 1},
                // {sql: '2', value: 2},
                // {sql: '3', value: 3},
                // {sql: '1.5', value: 1.5},
                // {sql: '2.5', value: 2.5},
                // {sql: '3.5', value: 3.5},
                // {sql: 'false', value: false},
                { sql: 'true', value: true },
            ];
            // for (let i = 0; i < 5; i++)
            //   values = [...values, ...values]
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const rows = await db.performQuery(types_1.ResultMode.arrays, `SELECT ${values.map(value => value.sql)}`);
            const row = rows[0];
            row.forEach((item, i) => {
                if ((item === null || item === void 0 ? void 0 : item.constructor) === Date)
                    row[i] = +row[i];
            });
            expect(row).toEqual(values.map(value => value.value));
            await db.close();
        });
        it('can load many rows', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const values = [];
            const lorem = "'Lorem ipsum dolor sit amet,consectetur adipiscing elit," +
                "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." +
                "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." +
                "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." +
                "Excepteur sint occaecat cupidatat non proident," +
                "sunt in culpa qui officia deserunt mollit anim id est laborum.'";
            for (let i = 0; i < 1000; i++) {
                values.push([i + 1, lorem]);
            }
            const results = await db.performQuery(types_1.ResultMode.arrays, `SELECT * FROM (VALUES ${values.map(values => `(${values.join(', ')})`).join(', ')}) t`);
            expect(results.length).toEqual(values.length);
            await db.close();
        });
        it('can load multiple results', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1, log: false });
            const results = await db.value('SELECT 1; SELECT 2');
            expect(results).toEqual([1, 2]);
            await db.close();
        });
    });
    describe('objects', () => {
        it('return objects', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const one = await db.objects('SELECT 1 as one');
            expect(one).toEqual([{ one: 1 }]);
            const two = await db.objects `SELECT ${'string'} as one`;
            expect(two).toEqual([{ one: 'string' }]);
            await db.close();
        });
    });
    describe('arrays', () => {
        it('return arrays', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const one = await db.arrays('SELECT 1 as one');
            expect(one).toEqual([[1]]);
            const two = await db.arrays `SELECT ${'string'} as one`;
            expect(two).toEqual([['string']]);
            await db.close();
        });
    });
    describe('value', () => {
        it('return value', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const one = await db.value('SELECT 1 as one');
            expect(one).toEqual(1);
            const two = await db.value `SELECT ${'string'} as one`;
            expect(two).toEqual('string');
            await db.close();
        });
    });
    describe('exec', () => {
        it('return nothing', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const one = await db.exec('SELECT 1 as one');
            expect(one).toEqual(undefined);
            const two = await db.exec `SELECT ${'string'} as one`;
            expect(two).toEqual(undefined);
            await db.close();
        });
    });
    describe('transaction', () => {
        it('creates a transaction', async () => {
            const queries = [];
            const db = adapter_1.Adapter.fromURL({ pool: 1, log: {
                    start: () => { },
                    finish: (socket, { query }) => { queries.push(query); },
                } });
            db.transaction((t) => {
                t.exec('SELECT 2');
            });
            db.exec('SELECT 1');
            await db.sync();
            expect(queries).toEqual(['BEGIN', 'SELECT 2', 'COMMIT', 'SELECT 1']);
            const target = { key: 'value' };
            let value;
            await db.wrapperTransaction(target, (t) => {
                value = t.key;
                t.exec('SELECT 1');
            });
            expect(value).toEqual(target.key);
            let error;
            try {
                await db.transaction((t) => {
                    t.exec('SELECT * FROM non_existing_table');
                    t.exec('SELECT 1');
                });
            }
            catch (err) {
                error = err;
                console.log(err);
            }
            expect(error).toBeTruthy();
            await db.close();
        });
    });
    describe('prepared', () => {
        it('makes prepared statements', async () => {
            const db = adapter_1.Adapter.fromURL({ pool: 1 });
            const q = db.prepare('queryName', 'text', 'integer', 'date') `SELECT $1 AS text, $2 AS integer, $3 AS date`;
            const result = await q.performQuery(0, ['text', 123, '01.01.2020']);
            const date = Date.UTC(2020, 0, 1);
            expect(result).toEqual([{ text: 'text', integer: 123, date: new Date(date) }]);
            await db.close();
        });
    });
});
