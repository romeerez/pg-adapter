import { Socket as NativeSocket } from 'net'
import { DecodeTypes, ResultMode, Log, Task, Socket, Prepared, ResultWithFields } from '../types'
import { PgError } from './error'
import { addTaskToAdapter, createTask } from './task'
import { defaultLog, noopLog } from './log'
import { Value } from './quote'
import { quote, raw } from './quote'
import interpolate from './interpolate'

export class AdapterBase {
  sockets: Socket[]
  decodeTypes: DecodeTypes
  log: Log
  task?: Task
  lastTask?: Task
  quote = quote
  raw = raw

  constructor({
    pool,
    decodeTypes,
    log,
  }: {
    pool: number
    decodeTypes: DecodeTypes
    log: boolean | Log
  }) {
    this.sockets = (new Array(pool)
      .fill(null)
      .map(
        () => new NativeSocket({ readable: true, writable: true }),
      ) as unknown) as Socket[]
    this.decodeTypes = decodeTypes
    if (log === true) this.log = defaultLog
    else if (log === false) this.log = noopLog
    else this.log = log
  }

  connect() {
    // noop
  }

  performQuery<T = any>(
    mode: ResultMode,
    query: string | Promise<string>,
    args?: Value,
    prepared?: Prepared,
    getFieldsInfo?: boolean,
  ) {
    this.connect()
    return new Promise<T>(async (resolve, reject) => {
      // eslint-disable-next-line
      if ((query as any).then) query = await query

      const error = new PgError()
      const task = createTask({
        mode,
        error,
        resolve,
        reject,
        prepared,
        getFieldsInfo,
        adapter: this,
        query: interpolate(query as string, args),
        decodeTypes: this.decodeTypes,
      })
      addTaskToAdapter(this, task)
    })
  }

  query<T = any>(sql: string | Promise<string>, args?: Value) {
    return this.performQuery<T>(ResultMode.objects, sql, args)
  }

  queryWithFields<T = any>(sql: string | Promise<string>, args?: Value) {
    return this.performQuery<ResultWithFields<T>>(ResultMode.objects, sql, args, undefined, true)
  }

  objects<T = any>(sql: string | Promise<string>, args?: Value) {
    return this.performQuery<T>(ResultMode.objects, sql, args)
  }

  objectsWithFields<T = any>(sql: string | Promise<string>, args?: Value) {
    return this.performQuery<ResultWithFields<T>>(ResultMode.objects, sql, args, undefined, true)
  }

  arrays<T>(sql: string | Promise<string>, args?: Value) {
    return this.performQuery<T>(ResultMode.arrays, sql, args)
  }

  arraysWithFields<T>(sql: string | Promise<string>, args?: Value) {
    return this.performQuery<ResultWithFields<T>>(ResultMode.arrays, sql, args, undefined, true)
  }

  value<T>(sql: string | Promise<string>, args?: Value) {
    return this.performQuery<T>(ResultMode.value, sql, args)
  }

  valueWithFields<T>(sql: string | Promise<string>, args?: Value) {
    return this.performQuery<ResultWithFields<T>>(ResultMode.value, sql, args, undefined, true)
  }

  exec(sql: string | Promise<string>, args?: Value) {
    return this.performQuery(ResultMode.skip, sql, args)
  }
}
