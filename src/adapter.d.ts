import { AdapterProps, ConnectionSettingType, Log, ResultMode } from './types';
import { AdapterBase } from './lib/adapterBase';
import { Transaction } from './lib/transaction';
export { quote } from './lib/quote';
export { sql } from './lib/sql';
export { parseUrl } from './lib/parseUrl';
export { Transaction };
export { AdapterBase };
export { AdapterProps };
export { ResultMode };
export declare class Adapter extends AdapterBase {
    static defaultLog: boolean | Log;
    connectionSettings: ConnectionSettingType;
    pool: number;
    connected: boolean;
    constructor({ host, port, database, user, password, pool, log, decodeTypes, }?: AdapterProps);
    static fromURL(urlOrOptions?: string | AdapterProps, options?: AdapterProps): Adapter;
    connect(): Promise<void>;
    sync: () => Promise<unknown> | undefined;
    close: () => Promise<void>;
    transaction(fn?: (t: Transaction) => any): Promise<any[]>;
    wrapperTransaction(target: any, fn?: (t: typeof target & Transaction) => any): Promise<any[]>;
    prepare(name: string, ...args: string[]): (prepareTemplate: TemplateStringsArray, prepareArgs?: any[] | undefined) => import("./types").Prepared;
}
