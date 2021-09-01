import { Task, Creds, Socket } from '../types'
import { getMessageLength, skipMessage } from './buffer'
import { auth } from './handlers/auth'
import { complete } from './handlers/complete'
import { parseError } from './handlers/errorOrNotice'
import { parseDescription } from './handlers/parseDescription'
import { parseRow } from './handlers/parseRow'

interface Message {
  buffer: Buffer
  cutMessageLength: number
  cutMessageAllocated: number
}

enum codes {
  authenticationCode = 'R'.charCodeAt(0),
  backendKeyDataCode = 'K'.charCodeAt(0),
  parameterStatusCode = 'S'.charCodeAt(0),
  readyForQueryCode = 'Z'.charCodeAt(0),
  rowDescriptionCode = 'T'.charCodeAt(0),
  dataRowCode = 'D'.charCodeAt(0),
  commandCompleteCode = 'C'.charCodeAt(0),
  errorResponseCode = 'E'.charCodeAt(0),
  noticeResponseCode = 'N'.charCodeAt(0),
  bindCode = 'B'.charCodeAt(0),
  parseCompleteCode = '1'.charCodeAt(0),
  bindCompleteCode = '2'.charCodeAt(0),
  closeCompleteCode = '3'.charCodeAt(0),
  copyDataCode = 'd'.charCodeAt(0),
  copyDoneCode = 'c'.charCodeAt(0),
  copyFailCode = 'f'.charCodeAt(0),
  copyInResponseCode = 'G'.charCodeAt(0),
  copyOutResponseCode = 'H'.charCodeAt(0),
  copyBothResponseCode = 'W'.charCodeAt(0),
  functionCallResponseCode = 'V'.charCodeAt(0),
  negotiateProtocolVersionCode = 'v'.charCodeAt(0),
  noDataCode = 'n'.charCodeAt(0),
  notificationResponseCode = 'A'.charCodeAt(0),
  emptyQueryResponseCode = 'I'.charCodeAt(0),
  parameterDescriptionCode = 't'.charCodeAt(0),
  portalSuspendedCode = 's'.charCodeAt(0),
}

// TODO: requires proper testing with edge cases
const listener = (
  socket: Socket,
  message: Message,
  creds: Creds,
  data: Buffer,
  size = data.length,
) => {
  let pos = 0
  let len = message.cutMessageLength
  if (len !== 0) {
    // calculate length if it didn't fit in prev block
    if (len === -1) {
      data.copy(message.buffer, message.cutMessageAllocated, 0, 5 - message.cutMessageAllocated)
      len = getMessageLength(message.buffer, 0)
      message.cutMessageLength = len
      if (message.buffer.length < len)
        message.buffer = Buffer.alloc(len + 1, message.buffer)
    }

    if (len > message.cutMessageAllocated + data.length) {
      data.copy(message.buffer, message.cutMessageAllocated)
      message.cutMessageAllocated += data.length
      return
    }

    const copySize = len - message.cutMessageAllocated
    data.copy(message.buffer, message.cutMessageAllocated)
    message.cutMessageLength = 0
    message.cutMessageAllocated = 0
    listener(socket, message, creds, message.buffer, len)
    pos = copySize + 1
  }
  const task = socket.task as Task
  while (pos < size) {
    len = pos + 4 < size ? getMessageLength(data, pos) : -1
    if (len === -1 || pos + len > size) {
      if (message.buffer.length < len)
        message.buffer = Buffer.alloc(len + 1, message.buffer)
      data.copy(message.buffer, message.cutMessageAllocated, pos)
      message.cutMessageAllocated = size - pos
      message.cutMessageLength = len
      break
    }
    const code = data[pos]
    if (code === codes.dataRowCode) {
      parseRow(socket, task, data, pos)
    } else if (code === codes.rowDescriptionCode) {
      parseDescription(socket, task, data, pos)
    } else if (code === codes.readyForQueryCode) {
      return task.finish(socket, task)
    } else if (code === codes.errorResponseCode) {
      const error = parseError(task, data, pos)
      task.failed = true
      Object.assign(task.error, error)
      if (error.level !== 'ERROR') return task.finish(socket, task)
    } else if (code === codes.noticeResponseCode) {
      const notice = parseError(task, data, pos)
      if (!task.notices) task.notices = [notice]
      else task.notices.push(notice)
    } else if (code === codes.authenticationCode) {
      auth(socket, task, creds, data, pos)
    } else if (code === codes.commandCompleteCode) {
      complete(task)
    } else {
      if (
        code !== codes.parameterStatusCode &&
        code !== codes.backendKeyDataCode
      ) {
        console.warn(
          `Handling of ${code} code is not implemented yet`,
        )
      }
    }
    pos += len + 1
  }
}

export const handleMessage = (socket: Socket, creds: Creds) => {
  const message: Message = {
    buffer: Buffer.alloc(10000),
    cutMessageLength: 0,
    cutMessageAllocated: 0,
  }
  socket.dataListener = (data: Buffer) => {
    listener(socket, message, creds, data)
  }
  socket.on('data', socket.dataListener)
}

export const removeListener = (socket: Socket) => {
  if (socket.dataListener) {
    socket.removeListener('data', socket.dataListener)
    delete socket.dataListener
  }
}
