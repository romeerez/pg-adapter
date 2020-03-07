const {skipMessage, getMessageLength} = require('./utils')
const {parseDescription} = require('./handlers/parseDescription')
const {parseRow} = require('./handlers/parseRow')
const {parseError} = require('./handlers/error')
const {auth} = require('./handlers/auth')
const {complete} = require('./handlers/complete')

const authenticationCode = 'R'.charCodeAt(0)
const backendKeyDataCode = 'K'.charCodeAt(0)
const parameterStatusCode = 'S'.charCodeAt(0)
const readyForQueryCode = 'Z'.charCodeAt(0)
const rowDescriptionCode = 'T'.charCodeAt(0)
const dataRowCode = 'D'.charCodeAt(0)
const commandCompleteCode = 'C'.charCodeAt(0)
const errorResponseCode = 'E'.charCodeAt(0)
const noticeResponseCode = 'N'.charCodeAt(0)
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
const notificationResponseCode = 'A'.charCodeAt(0)
const emptyQueryResponseCode = 'I'.charCodeAt(0)
const parameterDescriptionCode = 't'.charCodeAt(0)
const portalSuspendedCode = 's'.charCodeAt(0)

const copy = (socket, data, dataPos) =>
  data.copy(socket.buffer, socket.cutMessageAllocated, dataPos)

const handleMessage = (socket, data, size = data.length) => {
  let pos = 0
  let len = socket.cutMessageLength
  if (len !== 0) {
    if (len > socket.cutMessageAllocated + data.length) {
      copy(socket, data, 0)
      socket.cutMessageAllocated += data.length
      return
    }

    const copySize = len - socket.cutMessageAllocated
    copy(socket, data, 0)
    socket.cutMessageLength = 0
    socket.cutMessageAllocated = 0
    handleMessage(socket, socket.buffer, len)
    pos = copySize + 1
  }
  len = getMessageLength(data, pos)
  while (pos < size) {
    if (pos + len > size) {
      if (socket.buffer.length < len)
        socket.buffer = Buffer.alloc(len + 1, socket.buffer)
      copy(socket, data, pos)
      socket.cutMessageAllocated = size - pos
      socket.cutMessageLength = len
      break
    }
    const code = data[pos]
    if (code === dataRowCode) {
      parseRow(socket, data, pos)
    } else if (code === rowDescriptionCode) {
      parseDescription(socket, data, pos)
    } else if (code === readyForQueryCode) {
      return socket.finishTask()
    } else if (code === errorResponseCode || code === noticeResponseCode) {
      const {level} = parseError(socket, data, pos)
      if (level !== 'ERROR')
        return socket.finishTask()
    } else if (code === authenticationCode) {
      auth(socket, data, pos)
    } else if (code === commandCompleteCode) {
      complete(socket)
    } else {
      if (
        code !== parameterStatusCode &&
        code !== backendKeyDataCode
      ) {
        console.warn(`Handling of ${String.fromCharCode(code)} code is not implemented yet`)
      }
    }
    pos = skipMessage(data, pos)
    len = getMessageLength(data, pos)
  }
}

exports.handleMessage = handleMessage
