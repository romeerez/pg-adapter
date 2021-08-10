import {Socket as NativeSocket} from 'net'
import {AdapterBase} from './lib/adapterBase'

export type ResultWithFields<T = any> = { fields: FieldInfo[], result: T }

export interface Socket extends NativeSocket {
  task?: Task,
  dataListener?: (data: Buffer) => any,
  queryStartTime?: [number, number],
  prepared: {[key: string]: boolean}
}

export interface Creds {
  user: string,
  password: string,
}

export interface ConnectionSettingType {
  host: string
  port: number
  database: string
  user: string
  password: string
}

export interface Log {
  start: (socket: Socket, task: Task) => any,
  finish: (socket: Socket, task: Task) => any,
}

export interface AdapterProps extends Partial<ConnectionSettingType> {
  pool?: number,
  log?: boolean | Log,
  decodeTypes?: DecodeTypes
}

export interface PgError extends Error {
  message: string,
  query?: string,
  level?: string,
  details?: string,
  hint?: string,
  position?: string,
  innerPosition?: string,
  innerQuery?: string,
  trace?: string,
  schema?: string,
  table?: string,
  column?: string,
  dataType?: string,
  constraint?: string,
  file?: string,
  line?: string,
  process?: string,
}

export interface AuthData {
  clientNonce?: string,
  signature?: string,
}

export type DecodeFunction = (data: Buffer, pos: number, size: number) => any

export type DecodeTypes = {[key: string]: DecodeFunction}

export enum ResultMode {
  objects = 0,
  arrays = 1,
  value = 2,
  skip = 3,
}

export type FieldInfo = {
  name: string
  tableID: number
  columnID: number
  dataTypeID: number
  dataTypeSize: number
  dataTypeModifier: number
  format: number
}

export interface ParseInfo {
  resultNumber: number,
  skipNextValues: boolean,
  type?: number,
  names?: Array<string>,
  types?: Uint32Array,
  columnsCount?: number,
  fieldsInfo?: FieldInfo[]
}

export interface Task {
  adapter: AdapterBase,
  mode: ResultMode,
  error: PgError,
  query: string,
  resolve: (...args: any[]) => any,
  reject: (err: PgError) => any,
  finish: (socket: Socket, task: Task) => any,
  decodeTypes: DecodeTypes,
  parseInfo: ParseInfo,
  getFieldsInfo?: boolean
  failed?: boolean,
  authData?: AuthData,
  result?: any[] | undefined,
  next?: Task,
  last?: Task,
  prepared?: Prepared,
}

export interface Prepared {
  sql: string,
  name: string,
  performQuery<T = any>(mode: ResultMode, args: any[], getFieldsInfo?: boolean): Promise<T>,
  query<T = any>(...args: any[]): Promise<T>
  queryWithFields<T = any>(...args: any[]): Promise<ResultWithFields<T>>
  objects<T = any>(...args: any[]): Promise<T>
  objectsWithFields<T = any>(...args: any[]): Promise<ResultWithFields<T>>
  arrays<T = any>(...args: any[]): Promise<T>
  arraysWithFields<T = any>(...args: any[]): Promise<ResultWithFields<T>>
  value<T = any>(...args: any[]): Promise<T>
  valueWithFields<T = any>(...args: any[]): Promise<ResultWithFields<T>>
  exec<T = any>(...args: any[]): Promise<T>
}
