import { AdapterBase } from './adapterBase'
import { createTask, addTaskToAdapter, next } from './task'
import { Socket, Task, ResultMode, PgError, Prepared } from '../types'
import { noop } from './buffer'
import { Value } from './quote'

enum queries {
  begin = 'BEGIN',
  commit = 'COMMIT',
  rollback = 'ROLLBACK',
}

const applyFn = async <T extends Transaction>(proxy: T, fn: (t: T) => void) => {
  await fn(proxy)
  proxy.commit()
}

export const transaction = (
  adapter: AdapterBase,
  error: PgError,
  fn?: (t: Transaction) => void,
) => {
  const t = new Transaction(adapter, error)
  const promises = [t.promise]
  if (fn) promises.push(applyFn(t, fn))
  return Promise.all(promises)
}

export const wrapperTransaction = <T>(
  adapter: AdapterBase,
  error: PgError,
  target: T,
  fn?: (t: T & Transaction) => void,
) => {
  const t = new Transaction(adapter, error)
  const promises = [t.promise]
  const proxy = new Proxy(t, {
    get: (t: T & Transaction, name: keyof T & Transaction) => {
      return t[name] || target[name]
    },
  }) as T & Transaction
  if (fn) promises.push(applyFn(proxy, fn))
  return Promise.all(promises)
}

export class Transaction extends AdapterBase {
  adapter: AdapterBase
  error: PgError
  promise: Promise<unknown>
  resolve: () => void
  reject: (err: PgError) => void
  task?: Task
  failed = false

  constructor(adapter: AdapterBase, error: PgError) {
    super({ pool: 0, decodeTypes: adapter.decodeTypes, log: adapter.log })
    this.adapter = adapter
    this.error = error
    this.resolve = noop
    this.reject = noop
    this.promise = new Promise((resolve, reject) => {
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
    const { adapter } = task
    adapter.log.finish(socket, task)
    const index = adapter.sockets.indexOf(socket)
    adapter.sockets.splice(index, 1)
    this.sockets[0] = socket

    if (adapter.lastTask === task) adapter.lastTask = undefined

    socket.task = undefined
    next(this, socket)
  }

  transaction() {
    const error: PgError = new Error()
    return transaction(this, error)
  }

  commit(): Promise<unknown> {
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
    return (this as unknown) as Promise<unknown>
  }

  finish = (socket: Socket, task: Task) => {
    const transaction = task.adapter as Transaction
    transaction.log.finish(socket, task)
    const error = this.failed ? this.error : task.failed && task.error
    error ? task.reject(error) : task.resolve(error)
    transaction.sockets.length = 0
    transaction.task = task.next
    transaction.adapter.sockets.push(socket)
    if (transaction.adapter.lastTask === task)
      transaction.adapter.lastTask = undefined
    socket.task = undefined
    next(transaction.adapter, socket)
  }

  performQuery(
    mode: ResultMode,
    query: string | TemplateStringsArray,
    args?: TemplateStringsArray | Value[],
    prepared?: Prepared,
  ) {
    const promise = super.performQuery(mode, query, args, prepared)
    promise.catch(this.catch)
    return promise
  }

  catch = (err: PgError) => {
    if (this.failed) return
    this.error = err
    this.failed = true
  }

  then(...args: Parameters<Promise<unknown>['then']>) {
    this.promise.then(...args)
  }
}
