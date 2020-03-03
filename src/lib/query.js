const {nextTask} = require('./nextTask')

module.exports = {
  query(transaction, parseResultMode, message, error, taskParams) {
    transaction.connect()
    const task = {
      parseResultMode,
      message,
      error,
      resultNum: 0,
      result: null,
    }
    if (taskParams)
      Object.assign(task, taskParams)
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
    if (!taskParams || !task.resolve) {
      return new Promise((resolve, reject) => {
        task.resolve = resolve
        task.reject = reject
      })
    }
  }
}
