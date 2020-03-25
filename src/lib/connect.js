const {Socket} = require('net')
const tls = require('tls')
const net = require('net')
const {setupLog} = require('./setupLog')
const {finishTask} = require('./finishTask')
const {encodeInt32} = require('./utils')
const {handleMessage} = require('./messageHandler')
const {noop} = require('./utils')

const checkSSLMessage = Buffer.alloc(8)
encodeInt32(checkSSLMessage, 0, 8)
encodeInt32(checkSSLMessage, 4, 80877103)

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

const sendStartupMessage = (adapter, socket, error, resolve, reject) => {
  const {user, database} = adapter
  socket.buffer = Buffer.alloc(10000)
  socket.cutMessageLength = 0
  socket.cutMessageAllocated = 0
  socket.adapter = adapter
  socket.transaction = adapter
  socket.finishTask = finishTask.bind(null, socket)
  socket.query = socket.write.bind(socket)
  socket.prepared = {}
  socket.task = {error, resolve, reject}
  socket.on('data', handleMessage.bind(null, socket))
  socket.write(startupMessage(user, database))
}

const SSLCode = 'S'.charCodeAt(0)
const sslListener = (adapter, sockets, i, socket, error, resolve, reject, listener, [code]) => {
  socket.removeListener('data', listener.onData)
  if (code === SSLCode) {
    const options = {
      socket,
      checkServerIdentity: tls.checkServerIdentity,
      rejectUnauthorized: false,
    }
    if (net.isIP(adapter.host) === 0)
      options.servername = adapter.host
    sockets[i] = socket = tls.connect(options, () =>
      sendStartupMessage(adapter, socket, error, resolve, reject)
    )
  } else {
    sockets[i] = socket
    sendStartupMessage(adapter, socket, error, resolve, reject)
  }
}

module.exports = {
  async connect(adapter) {
    if (adapter.connected) return
    adapter.connected = true

    const {pool, port, host, ssl} = adapter
    const sockets = new Array(pool)
    adapter.sockets = sockets

    const error = new Error()
    const promises = new Array(pool)
    for (let i = 0; i < pool; i++) {
      let socket = new Socket({readable: true, writable: true})
      sockets[i] = socket
      socket.task = {error: {}, resolve: noop, reject: noop}
      promises[i] = new Promise((resolve, reject) => {
        socket.connect(port, host, () => {
          if (ssl === false) {
            sendStartupMessage(adapter, socket, error, resolve, reject)
          } else {
            socket.write(checkSSLMessage)
            const listener = {}
            listener.onData = sslListener.bind(
              null, adapter, sockets, i, socket, error, resolve, reject, listener
            )
            socket.on('data', listener.onData)
          }
        })
        socket.on('error', reject)
      })
    }
    await Promise.all(promises)

    if (adapter.log)
      setupLog(sockets)
  }
}
