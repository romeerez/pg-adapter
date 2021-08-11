import { Socket as NativeSocket } from 'net'
import { AdapterBase } from './lib/adapterBase'
import { Value } from './lib/quote'
import { PgError as PgErrorClass } from './lib/error'

export interface PgNotice {
  message: string
  code: string
  query?: string
  level?: string
  details?: string
  hint?: string
  position?: string
  innerPosition?: string
  innerQuery?: string
  trace?: string
  schema?: string
  table?: string
  column?: string
  dataType?: string
  constraint?: string
  file?: string
  line?: string
  process?: string
}

export type PgError = PgErrorClass

export type ResultWithFields<T = any> = { fields: FieldInfo[], result: T }

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
  start(socket: Socket, task: Task): void
  finish(socket: Socket, task: Task): void
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
  resultNumber: number
  skipNextValues: boolean
  type?: number
  names?: Array<string>
  types?: Uint32Array
  columnsCount?: number
  fieldsInfo?: FieldInfo[]
}

export interface Task {
  adapter: AdapterBase
  mode: ResultMode
  error: PgError
  query: string
  resolve: (...args: any[]) => any,
  reject: (err: PgError) => void
  finish: (socket: Socket, task: Task) => void
  decodeTypes: DecodeTypes
  failed?: boolean
  authData?: AuthData
  result?: unknown
  parseInfo: ParseInfo
  getFieldsInfo?: boolean
  next?: Task
  last?: Task
  prepared?: Prepared
  notices?: PgNotice[]
}

export interface Prepared<Args extends Value[] = Value[]> {
  sql: string
  name: string
  performQuery<T = any>(mode: ResultMode, args?: Args, getFieldsInfo?: boolean): Promise<T>
  query<T>(...args: Args): Promise<T>
  queryWithFields<T>(...args: Args): Promise<ResultWithFields<T>>
  objects<T>(...args: Args): Promise<T>
  objectsWithFields<T>(...args: Args): Promise<ResultWithFields<T>>
  arrays<T>(...args: Args): Promise<T>
  arraysWithFields<T>(...args: Args): Promise<ResultWithFields<T>>
  value<T>(...args: Args): Promise<T>
  valueWithFields<T>(...args: Args): Promise<ResultWithFields<T>>
  exec<T>(...args: Args): Promise<T>
}
