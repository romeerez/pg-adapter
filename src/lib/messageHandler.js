const {skipMessage, getMessageLength} = require('./utils')
const {parseDescription} = require('./handlers/parseDescription')
const {parseRow} = require('./handlers/parseRow')
const {parseError} = require('./handlers/error')
const {auth} = require('./handlers/auth')

const authenticationCode = 'R'.charCodeAt(0)
const backendKeyDataCode = 'K'.charCodeAt(0)
const parameterStatusCode = 'S'.charCodeAt(0)
const readyForQueryCode = 'Z'.charCodeAt(0)
const rowDescriptionCode = 'T'.charCodeAt(0)
const dataRowCode = 'D'.charCodeAt(0)
const commandCompleteCode = 'C'.charCodeAt(0)
const errorResponseCode = 'E'.charCodeAt(0)
const bindCode = 'B'.charCodeAt(0)
const parseCompleteCode = '1'.charCodeAt(0)
const bindCompleteCode = '2'.charCodeAt(0)
const closeCompleteCode = '3'.charCodeAt(0)
const copyDataCode = 'd'.charCodeAt(0)
const copyDoneCode = 'c'.charCodeAt(0)
const copyFailCode = 'f'.charCodeAt(0)
const copyInResponseCode = 'G'.charCodeAt(0)
const copyOutResponseCode = 'H'.charCodeAt(0)
const copyBothResponseCode = 'W'.charCodeAt(0)
const functionCallResponseCode = 'V'.charCodeAt(0)
const negotiateProtocolVersionCode = 'v'.charCodeAt(0)
const noDataCode = 'n'.charCodeAt(0)
const noticeResponseCode = 'N'.charCodeAt(0)
const notificationResponseCode = 'A'.charCodeAt(0)
const emptyQueryResponseCode = 'I'.charCodeAt(0)
const parameterDescriptionCode = 't'.charCodeAt(0)
const portalSuspendedCode = 's'.charCodeAt(0)

const copy = (socket, data, bufferPos, dataPos, size) => {
  if (socket.buffer.length < size)
    socket.buffer = Buffer.alloc(size * 2, socket.buffer)
  data.copy(socket.buffer, bufferPos, dataPos)
}

exports.handleMessage = (socket, data) => {
  let pos = 0
  let buffer, len
  let {size} = socket
  if (size) {
    size = socket.size + data.length
    copy(socket, data, socket.size, 0, size)
    socket.size = size
    buffer = socket.buffer
    len = socket.len
  } else {
    buffer = data
    size = data.length
    len = getMessageLength(buffer, pos)
  }
  while (pos < size) {
    if (pos + len > size) {
      if (socket.size === 0)
        copy(socket, data, 0, pos, size)
      socket.size = size - pos
      socket.len = len
      break
    }
    const code = buffer[pos]
    if (code === dataRowCode) {
      parseRow(socket, buffer, pos)
    } else if (code === rowDescriptionCode) {
      parseDescription(socket, buffer, pos)
    } else if (code === readyForQueryCode) {
      return socket.finishTask()
    } else if (code === errorResponseCode) {
      const {level} = parseError(socket, buffer, pos)
      if (level !== 'ERROR')
        break
    } else if (code === authenticationCode) {
      socket.error = auth(socket, buffer, pos)
    } else {
      if (
        code !== commandCompleteCode &&
        code !== parameterStatusCode &&
        code !== backendKeyDataCode
      ) {
        console.warn(`Handling of ${String.fromCharCode(code)} code is not implemented yet`)
      }
    }
    pos = skipMessage(buffer, pos)
    len = getMessageLength(buffer, pos)
  }
}
