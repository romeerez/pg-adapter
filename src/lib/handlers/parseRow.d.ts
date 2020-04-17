/// <reference types="node" />
import { Socket } from 'net';
import { Task } from '../../types';
export declare const parseRow: (socket: Socket, task: Task, data: Buffer, pos: number) => void;
