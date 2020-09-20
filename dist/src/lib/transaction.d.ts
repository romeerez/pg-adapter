import { AdapterBase } from './adapterBase';
import { Socket, Task, ResultMode, PgError, Prepared } from '../types';
export declare const transaction: (adapter: AdapterBase, error: PgError, fn?: ((t: Transaction) => any) | undefined) => Promise<any[]>;
export declare const wrapperTransaction: (adapter: AdapterBase, error: PgError, target: any, fn?: ((t: any) => any) | undefined) => Promise<any[]>;
export declare class Transaction extends AdapterBase {
    adapter: AdapterBase;
    error: PgError;
    promise: Promise<any>;
    resolve: () => any;
    reject: (err: PgError) => any;
    task?: Task;
    failed: boolean;
    constructor(adapter: AdapterBase, error: PgError);
    afterBegin: (socket: Socket, task: Task) => void;
    transaction(): Promise<any[]>;
    commit(): Promise<any>;
    rollback(): Promise<any>;
    end(query?: string, err?: PgError): Promise<any>;
    finish: (socket: Socket, task: Task) => void;
    performQuery(mode: ResultMode, query: string | TemplateStringsArray, args?: any[], prepared?: Prepared): Promise<unknown>;
    catch: (err: PgError) => void;
    then(...args: any[]): void;
}
