const {encodeInt32} = require('./utils')

const queryCode = 'Q'.charCodeAt(0)

module.exports = {
  queryCode,
  nextTask: (socket) => {
    const {transaction} = socket
    const {task} = transaction
    if (!task || task.transaction !== socket.transaction)
      return false

    if (task.next)
      task.next.last = task.last
    transaction.task = task.next
    task.socket = socket
    socket.error = null
    socket.task = task
    socket.cutMessageAllocated = 0
    socket.cutMessageLength = 0
    socket.resultNum = 0

    let message
    if (!task.prepared || socket.prepared[task.prepared.name])
      message = task.message
    else
      message = task.prepared.sql

    const len = message.length + 5
    const buffer = Buffer.alloc(len + 1)
    buffer[0] = queryCode
    encodeInt32(buffer, 1, len)
    buffer.fill(message, 5)
    buffer[len] = 0
    socket.query(buffer)
    return true
  }
}
