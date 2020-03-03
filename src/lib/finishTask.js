const {nextTask} = require('./nextTask')

exports.finishTask = (socket) => {
  const {task} = socket
  const {prepared} = task
  const prepareReady = prepared && !socket.prepared[prepared.name]
  if (socket.error)
    task.reject(socket.error)
  else if (!prepareReady)
    task.resolve(socket.result)

  socket.task = null

  if (task.startTransaction) {
    socket.adapter = socket.transaction
    socket.transaction = task.startTransaction
    task.startTransaction.socket = socket
  } else if (task.closeTransaction) {
    socket.adapter = socket.adapter.parentTransaction
    socket.transaction = socket.transaction.parentTransaction
  }

  if (prepareReady && !socket.error) {
    socket.prepared[prepared.name] = true
    const {transaction} = socket
    if (transaction.task) {
      task.next = transaction.task
      task.last = transaction.task.last
    }
    transaction.task = task
  }

  nextTask(socket)
}
