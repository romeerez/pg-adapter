/// <reference types="node" />
import { Task, PgError } from 'types';
export declare const parseError: (task: Task, data: Buffer, pos: number) => PgError & Partial<PgError>;
