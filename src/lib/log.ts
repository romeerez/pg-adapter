import {Log} from '../types'
import chalk from 'chalk'

export const defaultLog: Log = {
  start: (socket) => {
    socket.queryStartTime = process.hrtime()
  },
  finish: (socket, task) => {
    const time = (process.hrtime(socket.queryStartTime)[1] / 1000000).toFixed(1)
    if (task.failed)
      console.log(chalk.bold.magenta(`(${time}ms)`) + ' ' + chalk.bold.red(task.query))
    else
      console.log(chalk.bold.cyanBright(`(${time}ms)`) + ' ' + chalk.bold.blue(task.query))
  }
}

const noop = () => {}
export const noopLog: Log = {
  start: noop,
  finish: noop,
}
