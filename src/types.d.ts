/// <reference types="node" />
import { Socket as NativeSocket } from 'net';
import { AdapterBase } from './lib/adapterBase';
export interface Socket extends NativeSocket {
    task?: Task;
    dataListener?: (data: Buffer) => any;
    queryStartTime?: [number, number];
    prepared: {
        [key: string]: boolean;
    };
}
export interface Creds {
    user: string;
    password: string;
}
export interface ConnectionSettingType {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}
export interface Log {
    start: (socket: Socket, task: Task) => any;
    finish: (socket: Socket, task: Task) => any;
}
export interface AdapterProps extends Partial<ConnectionSettingType> {
    pool?: number;
    log?: boolean | Log;
    decodeTypes?: DecodeTypes;
}
export interface PgError extends Error {
    message: string;
    query?: string;
    level?: string;
    details?: string;
    hint?: string;
    position?: string;
    innerPosition?: string;
    innerQuery?: string;
    trace?: string;
    schema?: string;
    table?: string;
    column?: string;
    dataType?: string;
    constraint?: string;
    file?: string;
    line?: string;
    process?: string;
}
export interface AuthData {
    clientNonce?: string;
    signature?: string;
}
export declare type DecodeFunction = (data: Buffer, pos: number, size: number) => any;
export declare type DecodeTypes = {
    [key: string]: DecodeFunction;
};
export declare enum ResultMode {
    objects = 0,
    arrays = 1,
    value = 2,
    skip = 3
}
export interface ParseInfo {
    resultNumber: number;
    skipNextValues: boolean;
    type?: number;
    names?: Array<string>;
    types?: Uint32Array;
    columnsCount?: number;
}
export interface Task {
    adapter: AdapterBase;
    mode: ResultMode;
    error: PgError;
    query: string;
    resolve: (...args: any[]) => any;
    reject: (err: PgError) => any;
    finish: (socket: Socket, task: Task) => any;
    decodeTypes: DecodeTypes;
    failed?: boolean;
    authData?: AuthData;
    result?: any[] | undefined;
    parseInfo: ParseInfo;
    next?: Task;
    last?: Task;
    prepared?: Prepared;
}
export interface Prepared {
    sql: string;
    name: string;
    performQuery: (mode: ResultMode, args: any[]) => Promise<any>;
    query: (...args: any[]) => Promise<any>;
    objects: (...args: any[]) => Promise<any>;
    arrays: (...args: any[]) => Promise<any>;
    value: (...args: any[]) => Promise<any>;
    exec: (...args: any[]) => Promise<any>;
}
