const {queryCode} = require('./nextTask')

exports.setupLog = (sockets) => {
  const chalk = require('chalk')
  for (let socket of sockets) {
    const {query} = socket
    const socketFinishTask = socket.finishTask
    let start, sql
    socket.query = (message) => {
      if (message[0] === queryCode) {
        start = process.hrtime()
        sql = message.slice(5, -1)
      } else {
        sql = null
      }
      query(message)
    }
    socket.finishTask = () => {
      if (sql) {
        const time = (process.hrtime(start)[1] / 1000000).toFixed(1)
        if (socket.error)
          console.log(chalk.bold.magenta(`(${time}ms)`) + ' ' + chalk.bold.red(sql))
        else
          console.log(chalk.bold.cyanBright(`(${time}ms)`) + ' ' + chalk.bold.blue(sql))
      }
      socketFinishTask()
    }
  }
}
