import { Socket as NativeSocket } from 'net'
import { AdapterBase } from './lib/adapterBase'
import { Value } from './lib/quote'
import { PgError as PgErrorClass } from './lib/error'

export type PgError = PgErrorClass

export interface Socket extends NativeSocket {
  task?: Task
  dataListener?: (data: Buffer) => void
  queryStartTime?: [number, number]
  prepared: { [key: string]: boolean }
}

export interface Creds {
  user: string
  password: string
}

export interface ConnectionSettingType {
  host: string
  port: number
  database: string
  user: string
  password: string
}

export interface Log {
  start: <T>(socket: Socket, task: Task<T>) => void
  finish: <T>(socket: Socket, task: Task<T>) => void
}

export interface AdapterProps extends Partial<ConnectionSettingType> {
  pool?: number
  log?: boolean | Log
  decodeTypes?: DecodeTypes
}

export interface AuthData {
  clientNonce?: string
  signature?: string
}

export type DecodeFunction = (data: Buffer, pos: number, size: number) => void

export type DecodeTypes = { [key: string]: DecodeFunction }

export enum ResultMode {
  objects = 0,
  arrays = 1,
  value = 2,
  skip = 3,
}

export interface ParseInfo {
  resultNumber: number
  skipNextValues: boolean
  type?: number
  names?: Array<string>
  types?: Uint32Array
  columnsCount?: number
}

export interface Task<T = unknown> {
  adapter: AdapterBase
  mode: ResultMode
  error: PgError
  query: string
  resolve: (result?: T) => void
  reject: (err: PgError) => void
  finish: (socket: Socket, task: Task<T>) => void
  decodeTypes: DecodeTypes
  failed?: boolean
  authData?: AuthData
  result?: T
  parseInfo: ParseInfo
  next?: Task<T>
  last?: Task<T>
  prepared?: Prepared
}

export interface Prepared {
  sql: string
  name: string
  performQuery: (
    mode: ResultMode,
    args: TemplateStringsArray | Value[],
  ) => Promise<unknown>
  query: (...args: TemplateStringsArray | Value[]) => Promise<unknown>
  objects: (...args: TemplateStringsArray | Value[]) => Promise<unknown>
  arrays: (...args: TemplateStringsArray | Value[]) => Promise<unknown>
  value: (...args: TemplateStringsArray | Value[]) => Promise<unknown>
  exec: (...args: TemplateStringsArray | Value[]) => Promise<unknown>
}
