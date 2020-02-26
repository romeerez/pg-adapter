exports.close = async (adapter) => {
  await adapter.sync()

  adapter.connected = false
  for (let socket of adapter.sockets)
    socket.destroy()
}
