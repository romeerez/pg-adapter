import { Adapter } from '../adapter'
import { removeListener } from './messageHandler'

export const close = async (adapter: Adapter) => {
  await adapter.sync()

  adapter.connected = false
  for (const socket of adapter.sockets) {
    socket.destroy()
    removeListener(socket)
  }
}
