import { Task, Socket } from '../types'

export const sync = ({ lastTask: last }: { lastTask?: Task }) => {
  if (!last) return

  const { finish } = last as Task
  return new Promise<void>((resolve) => {
    last.finish = (socket: Socket, task: Task) => {
      finish(socket, task)
      resolve()
    }
  })
}
