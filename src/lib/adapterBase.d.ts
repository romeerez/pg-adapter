import { DecodeTypes, ResultMode, Log, Task, Socket, Prepared } from '../types';
export declare class AdapterBase {
    sockets: Socket[];
    decodeTypes: DecodeTypes;
    log: Log;
    task?: Task;
    lastTask?: Task;
    constructor({ pool, decodeTypes, log }: {
        pool: number;
        decodeTypes: DecodeTypes;
        log: boolean | Log;
    });
    connect(): void;
    performQuery: (mode: ResultMode, query: string | TemplateStringsArray, args?: any[] | undefined, prepared?: Prepared | undefined) => Promise<unknown>;
    query(sql: string | TemplateStringsArray, ...args: any[]): Promise<unknown>;
    objects(sql: string | TemplateStringsArray, ...args: any[]): Promise<unknown>;
    arrays(sql: string | TemplateStringsArray, ...args: any[]): Promise<unknown>;
    value(sql: string | TemplateStringsArray, ...args: any[]): Promise<unknown>;
    exec(sql: string | TemplateStringsArray, ...args: any[]): Promise<unknown>;
}
