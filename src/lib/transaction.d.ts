import { AdapterBase } from './adapterBase';
import { Socket, Task, PgError } from '../types';
export declare const transaction: (adapter: AdapterBase, error: PgError, fn?: ((t: Transaction) => any) | undefined) => Transaction;
export declare const wrapperTransaction: (adapter: AdapterBase, error: PgError, target: any, fn?: ((t: any) => any) | undefined) => any;
export declare class Transaction extends AdapterBase {
    adapter: AdapterBase;
    error: PgError;
    promise: Promise<any>;
    resolve: () => any;
    reject: () => any;
    task?: Task;
    constructor(adapter: AdapterBase, error: PgError);
    start(): this;
    afterBegin: (socket: Socket, task: Task) => void;
    transaction(): Transaction;
    commit(): Promise<any>;
    rollback(): Promise<any>;
    end(query?: string): Promise<any>;
    finish: (socket: Socket, task: Task) => void;
    then(...args: any[]): void;
}
