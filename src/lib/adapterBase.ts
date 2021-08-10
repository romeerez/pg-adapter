import {Socket as NativeSocket} from 'net'
import {DecodeTypes, PgError, ResultMode, Log, Task, Socket, Prepared, ResultWithFields} from '../types'
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

  performQuery<T = any>(mode: ResultMode, query: string | TemplateStringsArray, args?: any[], prepared?: Prepared, getFieldsInfo?: boolean) {
    this.connect()
    return new Promise<T>((resolve, reject) => {
      const error: PgError = new Error()
      const task = createTask({
        mode,
        error,
        resolve,
        reject,
        prepared,
        getFieldsInfo,
        adapter: this,
        query: sql2(query, args),
        decodeTypes: this.decodeTypes,
      })
      addTaskToAdapter(this, task)
    })
  }

  query<T = any>(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery<T>(ResultMode.objects, sql, args)
  }

  queryWithFields<T = any>(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery<ResultWithFields<T>>(ResultMode.objects, sql, args, undefined, true)
  }

  objects<T = any>(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery<T>(ResultMode.objects, sql, args)
  }

  objectsWithFields<T = any>(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery<ResultWithFields<T>>(ResultMode.objects, sql, args, undefined, true)
  }

  arrays<T = any>(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery<T>(ResultMode.arrays, sql, args)
  }

  arraysWithFields<T = any>(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery<ResultWithFields<T>>(ResultMode.arrays, sql, args, undefined, true)
  }

  value<T>(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery<T>(ResultMode.value, sql, args)
  }

  valueWithFields<T>(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery<ResultWithFields<T>>(ResultMode.value, sql, args, undefined, true)
  }

  exec(sql: string | TemplateStringsArray, ...args: any[]) {
    return this.performQuery(ResultMode.skip, sql, args)
  }
}
