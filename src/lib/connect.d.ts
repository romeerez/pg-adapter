import { Socket, ConnectionSettingType } from '../types';
import { Adapter } from '../adapter';
export declare const connect: (adapter: Adapter, socket: Socket, settings: ConnectionSettingType) => Promise<Socket>;
