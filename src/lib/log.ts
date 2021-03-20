import { Log } from '../types'
import chalk from 'chalk'
import { noop } from './buffer'

let toggle = 0

export const defaultLog: Log = {
  start: (socket) => {
    socket.queryStartTime = process.hrtime()
  },
  finish: (socket, task) => {
    const time = (process.hrtime(socket.queryStartTime)[1] / 1000000).toFixed(1)
    if (task.failed)
      console.log(
        chalk.bold.magenta(`(${time}ms)`) + ' ' + chalk.bold.red(task.query),
      )
    else if (toggle === 0) {
      toggle = 1
      console.log(
        chalk.bold.cyanBright(`(${time}ms)`) +
          ' ' +
          chalk.bold.blue(task.query),
      )
    } else {
      toggle = 0
      console.log(
        chalk.bold.cyanBright(`(${time}ms)`) +
          ' ' +
          chalk.bold.cyan(task.query),
      )
    }

    if (task.notices)
      task.notices.forEach((notice) => {
        console.log(
          chalk.bold.yellow(`NOTICE:`) +
            ' ' +
            chalk.bold.whiteBright(notice.message),
        )
      })
  },
}

export const noopLog: Log = {
  start: noop,
  finish: noop,
}
