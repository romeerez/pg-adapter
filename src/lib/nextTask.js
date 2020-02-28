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
    const len = task.message.length + 5
    const message = Buffer.alloc(len + 1)
    message[0] = queryCode
    encodeInt32(message, 1, len)
    message.fill(task.message, 5)
    message[len] = 0
    socket.query(message)
    return true
  }
}
