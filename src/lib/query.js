const {nextTask} = require('./nextTask')

module.exports = {
  query(transaction, parseResultMode, message, error, resolve, reject, startTransaction, closeTransaction) {
    transaction.connect()
    const task = {
      parseResultMode,
      message,
      error,
      startTransaction,
      closeTransaction,
      resultNum: 0,
      result: null,
    }
    task.transaction = transaction
    if (!transaction.task) {
      transaction.task = task
      task.last = task
      for (let socket of transaction.sockets)
        if (!socket.task)
          if (nextTask(socket))
            break
    } else {
      transaction.task.last.next = task
      transaction.task.last = task
    }
    if (resolve && reject) {
      task.resolve = resolve
      task.reject = reject
    } else {
      return new Promise((resolve, reject) => {
        task.resolve = resolve
        task.reject = reject
      })
    }
  }
}
