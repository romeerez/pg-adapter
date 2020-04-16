import {Adapter} from 'adapter'
import {removeListener} from 'lib/messageHandler'

export const close = async (adapter: Adapter) => {
  await adapter.sync()

  adapter.connected = false
  for (let socket of adapter.sockets) {
    socket.destroy()
    removeListener(socket)
  }
}
