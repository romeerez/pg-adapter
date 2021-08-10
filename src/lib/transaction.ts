import {AdapterBase} from './adapterBase'
import {createTask, addTaskToAdapter, next} from './task'
import {Socket, Task, ResultMode, PgError, Prepared} from '../types'

const noop = () => {}

enum queries {
  begin = 'BEGIN',
  commit = 'COMMIT',
  rollback = 'ROLLBACK',
}

const applyFn = async (t: Transaction, fn: (t: Transaction) => any) => {
  await fn(t)
  t.commit()
}

export const transaction = (adapter: AdapterBase, error: PgError, fn?: (t: Transaction) => any) => {
  const t = new Transaction(adapter, error)
  const promises = [t.promise]
  if (fn)
    promises.push(applyFn(t, fn))
  return Promise.all(promises)
}

export const wrapperTransaction = (
  adapter: AdapterBase, error: PgError, target: any, fn?: (t: typeof target & Transaction) => any
) => {
  const t = new Transaction(adapter, error)
  const promises = [t.promise]
  const proxy = new Proxy(t, {
    get: (t, name) => (t as any)[name] || (target as any)[name]
  })
  if (fn)
    promises.push(applyFn(proxy, fn))
  return Promise.all(promises)
}

export class Transaction extends AdapterBase {
  adapter: AdapterBase
  error: PgError
  promise: Promise<any>
  resolve: () => any
  reject: (err: PgError) => any
  task?: Task
  failed = false

  constructor(adapter: AdapterBase, error: PgError) {
    super({pool: 0, decodeTypes: adapter.decodeTypes, log: adapter.log})
    this.adapter = adapter
    this.error = error
    this.resolve = noop
    this.reject = noop
    this.promise = new Promise<void>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
    this.adapter.connect()

    const task = createTask({
      adapter: this.adapter,
      error: this.error,
      resolve: noop,
      reject: noop,
      decodeTypes: this.adapter.decodeTypes,
      mode: ResultMode.skip,
      query: queries.begin,
      finish: this.afterBegin,
    })
    addTaskToAdapter(this.adapter, task)
  }

  afterBegin = (socket: Socket, task: Task) => {
    const {adapter} = task
    adapter.log.finish(socket, task)
    const index = adapter.sockets.indexOf(socket)
    adapter.sockets.splice(index, 1)
    this.sockets[0] = socket

    if (adapter.lastTask === task)
      adapter.lastTask = undefined

    socket.task = undefined
    next(this, socket)
  }

  transaction() {
    const error: PgError = new Error()
    return transaction(this, error)
  }

  commit(): Promise<any> {
    return this.end(queries.commit)
  }

  rollback() {
    return this.end(queries.rollback)
  }

  end(query: string = queries.commit, err?: PgError) {
    const task = createTask({
      query,
      adapter: this,
      error: err || this.error,
      resolve: this.resolve,
      reject: this.reject,
      finish: this.finish,
      decodeTypes: this.adapter.decodeTypes,
      mode: ResultMode.skip,
    })
    addTaskToAdapter(this, task)
    return this as unknown as Promise<any>
  }

  finish = (socket: Socket, task: Task) => {
    const transaction = task.adapter as Transaction
    transaction.log.finish(socket, task)
    let error = this.failed ? this.error : task.failed && task.error
    error ? task.reject(error) : task.resolve(error)
    transaction.sockets.length = 0
    transaction.task = task.next
    transaction.adapter.sockets.push(socket)
    if (transaction.adapter.lastTask === task)
      transaction.adapter.lastTask = undefined
    socket.task = undefined
    next(transaction.adapter, socket)
  }

  performQuery(mode: ResultMode, query: string | TemplateStringsArray, args?: any[], prepared?: Prepared, getFieldsInfo?: boolean) {
    const promise = super.performQuery(mode, query, args, prepared, getFieldsInfo)
    promise.catch(this.catch)
    return promise
  }

  catch = (err: PgError) => {
    if (this.failed)
      return
    this.error = err
    this.failed = true
  }

  then(...args: any[]) {
    this.promise.then(...args)
  }
}
