/// <reference types="node" />
import { Socket } from 'net';
import { Task } from '../../types';
export declare const parseDescription: (socket: Socket, request: Task, data: Buffer, pos: number) => void;
