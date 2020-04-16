import {AdapterBase} from 'lib/adapterBase'
import {createTask, addTaskToAdapter, next} from 'lib/task'
import {Socket, Task, ResultMode, PgError} from 'types'
import {noop} from 'lib/buffer'

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
  const t = new Transaction(adapter, error).start()
  if (fn)
    applyFn(t, fn)
  return t
}

export class Transaction extends AdapterBase {
  adapter: AdapterBase
  error: PgError
  promise: Promise<any>
  resolve: () => any
  reject: () => any
  task?: Task

  constructor(adapter: AdapterBase, error: PgError) {
    super({pool: 0, decodeTypes: adapter.decodeTypes, log: adapter.log})
    this.adapter = adapter
    this.error = error
    this.resolve = noop
    this.reject = noop
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  start() {
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
    addTaskToAdapter(this.adapter, task as Task)
    return this
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

  end(query: string = queries.commit) {
    const task = createTask({
      query,
      adapter: this,
      error: this.error,
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
    task.failed ? task.reject(task.error) : task.resolve()
    transaction.sockets.length = 0
    transaction.task = task.next
    transaction.adapter.sockets.push(socket)
    if (transaction.adapter.lastTask === task)
      transaction.adapter.lastTask = undefined
    socket.task = undefined
    next(transaction.adapter, socket)
  }

  then(...args: any[]) {
    this.promise.then(...args)
  }
}
