const {encodeInt32, noop, throwError} = require('./utils')

const versionBuf = Buffer.alloc(4)
encodeInt32(versionBuf, 0, 196608)
const startupMessage = (user, database) => {
  const message = `user\0${user}\0database\0${database}\0\0`
  const len = 8 + message.length
  const buf = Buffer.alloc(len)
  encodeInt32(buf, 0, len)
  versionBuf.copy(buf, 4)
  buf.fill(message, 8)
  return buf
}

module.exports = {
  connect(adapter)  {
    if (adapter.connected) return
    adapter.connected = true

    const {sockets, pool, host, port, user, database} = adapter
    const error = new Error()
    for (let i = 0; i < pool; i++) {
      const socket = sockets[i]
      socket.task = {error, resolve: noop, reject: throwError}

      socket.connect(port, host, () => {
        socket.write(startupMessage(user, database))
      })
    }
  }
}
