import {Socket as NativeSocket} from 'net'
import {DecodeTypes, PgError, ResultMode, Log, Task, Socket, Prepared} from '../types'
import {addTaskToAdapter, createTask} from './task'
import {sql2} from './sql'
import {defaultLog, noopLog} from './log'

export class AdapterBase {
  sockets: Socket[]
  decodeTypes: DecodeTypes
  log: Log
  task?: Task
  lastTask?: Task

  constructor({pool, decodeTypes, log}: {pool: number, decodeTypes: DecodeTypes, log: boolean | Log}) {
    this.sockets = new Array(pool).fill(null).map(() =>
      new NativeSocket({readable: true, writable: true})
    ) as unknown as Socket[]
    this.decodeTypes = decodeTypes
    if (log === true)
      this.log = defaultLog
    else if (log === false)
      this.log = noopLog
    else
      this.log = log
  }

  connect() {}

  performQuery = (mode: ResultMode, query: string | TemplateStringsArray, args?: any[], prepared?: Prepared) => {
    this.connect()
    return new Promise((resolve, reject) => {
      const error: PgError = new Error()
      const task = createTask({
        mode, error, resolve, reject, prepared,
        adapter: this,
        query: sql2(query, args),
        decodeTypes: this.decodeTypes,
      })
      addTaskToAdapter(this, task)
    })
  }

  query(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery(ResultMode.objects, sql, args)
  }

  objects(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery(ResultMode.objects, sql, args)
  }

  arrays(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery(ResultMode.arrays, sql, args)
  }

  value(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery(ResultMode.value, sql, args)
  }

  exec(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery(ResultMode.skip, sql, args)
  }
}
