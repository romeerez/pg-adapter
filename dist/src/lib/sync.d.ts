import { Task } from '../types';
export declare const sync: ({ lastTask: last }: {
    lastTask?: Task;
}) => Promise<unknown> | undefined;
