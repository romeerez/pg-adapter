import { AdapterBase } from './adapterBase';
import { DecodeTypes, PgError, ResultMode, Task, Socket, Log } from '../types';
declare type RequiredParams = {
    adapter: AdapterBase;
    mode: ResultMode;
    query: string;
    error: PgError;
    decodeTypes: DecodeTypes;
    resolve: (...args: any[]) => any;
    reject: (err: PgError) => any;
};
export declare const createTask: (params: Partial<Task> & RequiredParams) => Task;
export declare const addTaskToAdapter: (adapter: {
    task?: Task | undefined;
    lastTask?: Task | undefined;
    sockets: Socket[];
    log: Log;
}, task: Task) => void;
export declare const next: (adapter: {
    task?: Task | undefined;
    lastTask?: Task | undefined;
    log: Log;
}, socket: Socket) => void;
export {};
