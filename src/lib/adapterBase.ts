import { Socket as NativeSocket } from 'net'
import { DecodeTypes, ResultMode, Log, Task, Socket, Prepared } from '../types'
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

  performQuery(
    mode: ResultMode,
    query: string | Promise<string>,
    args?: Value,
    prepared?: Prepared,
  ) {
    this.connect()
    return new Promise(async (resolve, reject) => {
      // eslint-disable-next-line
      if ((query as any).then) query = await query

      const error = new PgError()
      const task = createTask({
        mode,
        error,
        resolve,
        reject,
        prepared,
        adapter: this,
        query: interpolate(query as string, args),
        decodeTypes: this.decodeTypes,
      })
      addTaskToAdapter(this, task)
    })
  }

  query(sql: string | Promise<string>, args?: Value) {
    return this.performQuery(ResultMode.objects, sql, args)
  }

  objects(sql: string | Promise<string>, args?: Value) {
    return this.performQuery(ResultMode.objects, sql, args)
  }

  arrays(sql: string | Promise<string>, args?: Value) {
    return this.performQuery(ResultMode.arrays, sql, args)
  }

  value(sql: string | Promise<string>, args?: Value) {
    return this.performQuery(ResultMode.value, sql, args)
  }

  exec(sql: string | Promise<string>, args?: Value) {
    return this.performQuery(ResultMode.skip, sql, args)
  }
}
