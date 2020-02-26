const {nextTask} = require('./nextTask')

exports.finishTask = (socket) => {
  const {task} = socket
  if (socket.error)
    task.reject(socket.error)
  else
    task.resolve(task.result)

  socket.task = null

  if (task.startTransaction) {
    socket.adapter = socket.transaction
    socket.transaction = task.startTransaction
    task.startTransaction.socket = socket
  } else if (task.closeTransaction) {
    socket.adapter = socket.adapter.parentTransaction
    socket.transaction = socket.transaction.parentTransaction
  }

  nextTask(socket)
}
