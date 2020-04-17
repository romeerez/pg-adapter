/// <reference types="node" />
import { Socket } from 'net';
import { Creds, Task } from '../../types';
export declare enum codes {
    success = 0,
    kerberosV5 = 2,
    cleartextPassword = 3,
    md5 = 5,
    SCMCredential = 6,
    GSS = 7,
    SSPI = 9,
    SASLInit = 10,
    SASLContinue = 11,
    SASLFinal = 12
}
export declare const auth: (socket: Socket, request: Task, creds: Creds, data: Buffer, pos: number) => string | undefined;
