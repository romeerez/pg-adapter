import { AdapterBase } from './adapterBase'
import {
  DecodeTypes,
  PgError,
  ResultMode,
  Task,
  Socket,
  Log,
  Prepared,
} from '../types'
import { encodeInt32 } from './buffer'

type RequiredParams = {
  adapter: AdapterBase
  mode: ResultMode
  query: string
  error: PgError
  decodeTypes: DecodeTypes
  resolve: (...args: unknown[]) => void
  reject: (err: PgError) => void
}

const finishTask = (socket: Socket, task: Task) => {
  const { adapter } = task
  const { prepared } = task
  const prepareReady = prepared && !socket.prepared[prepared.name]
  if (!prepareReady) adapter.log.finish(socket, task)
  if (task.failed) task.reject(task.error)
  else if (!prepareReady) task.resolve(task.result)

  socket.task = undefined

  if (prepareReady && !task.failed) {
    socket.prepared[(prepared as Prepared).name] = true
    if (adapter.task) task.next = adapter.task
    else adapter.lastTask = task
    adapter.task = task
    task.parseInfo.resultNumber = 0
  } else if (adapter.lastTask === task) {
    adapter.lastTask = undefined
  }

  next(adapter, socket)
}

export const createTask: (params: Partial<Task> & RequiredParams) => Task = ({
  adapter,
  mode,
  query,
  error,
  decodeTypes,
  prepared,
  resolve,
  reject,
  finish = finishTask,
}) => ({
  adapter,
  mode,
  query,
  error,
  decodeTypes,
  prepared,
  resolve,
  reject,
  finish,
  parseInfo: {
    resultNumber: 0,
    skipNextValues: false,
  },
})

export const addTaskToAdapter = (
  adapter: { task?: Task; lastTask?: Task; sockets: Socket[]; log: Log },
  task: Task,
) => {
  if (adapter.task) {
    ;(adapter.lastTask as Task).next = task
    adapter.lastTask = task
  } else {
    adapter.task = task
    adapter.lastTask = task
    for (const socket of adapter.sockets) {
      if (!socket.task) {
        next(adapter, socket)
        return
      }
    }
  }
}

const queryCode = 'Q'.charCodeAt(0)

export const next = (
  adapter: { task?: Task; lastTask?: Task; log: Log },
  socket: Socket,
) => {
  const { task } = adapter
  if (!task) return

  socket.task = task
  adapter.task = task.next

  let query: string
  if (!task.prepared || socket.prepared[task.prepared.name]) query = task.query
  else query = task.prepared.sql

  const len = Buffer.byteLength(query) + 5
  const buffer = Buffer.alloc(len + 1)
  buffer[0] = queryCode
  encodeInt32(buffer, 1, len)
  buffer.fill(query, 5)
  buffer[len] = 0
  adapter.log.start(socket, task)
  socket.write(buffer)
}
