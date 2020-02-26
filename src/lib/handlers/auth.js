const crypto = require('crypto')
const {decodeInt32, encodeInt32, getMessage} = require('../utils')

const authSuccess = 0
const authKerberosV5 = 2
const authCleartextPassword = 3
const authMD5 = 5
const authSCMCredential = 6
const authGSS = 7
const authSSPI = 9
const authSASLInit = 10
const authSASLContinue = 11
const authSASLFinal = 12

const makeAuthCleartext = (socket) =>
  respond(socket, Buffer.from(`p\0\0\0\0${socket.adapter.password}\0`, 'utf8'))

const makeAuthMD5 = (socket, data) => {
  let message
  const {password, user} = socket.adapter

  const crypto = require('crypto')
  const md5 = (data) =>
    crypto.createHash('md5').update(data, 'utf-8').digest('hex')

  const creds = md5(password + user)
  const salt = data.slice(9)
  message = 'md5' + md5(Buffer.concat([Buffer.from(creds), salt]))

  respond(socket, Buffer.from(`p\0\0\0\0${message}\0`, 'utf8'))
}

const makeAuthSASLInit = (socket) => {
  const clientNonce = crypto.randomBytes(18).toString('base64')
  socket.clientNonce = clientNonce
  const message = 'n,,n=*,r=' + clientNonce
  const mechanism = 'SCRAM-SHA-256'
  const buffer = Buffer.from(`p\0\0\0\0${mechanism}\0\0\0\0\0${message}`)
  encodeInt32(buffer, 6 + mechanism.length, message.length)
  respond(socket, buffer)
}

const makeAuthSASLContinue = (socket, data) => {
  let nonce, salt, iteration
  String(getMessage(data, 0, 4)).split(',').forEach(param => {
    if (param[0] === 'r')
      nonce = param.slice(2)
    else if (param[0] === 's')
      salt = param.slice(2)
    else if (param[0] === 'i')
      iteration = param.slice(2)
  })

  if (!nonce)
    throw new Error('SASL: nonce missing')

  if (!salt)
    throw new Error('SASL: salt missing')

  if (!iteration)
    throw new Error('SASL: iteration missing')

  if (!nonce.startsWith(socket.clientNonce))
    throw new Error('SASL: server nonce does not start with client nonce')

  const password = Buffer.from(socket.adapter.password, 'utf8')
  const saltBytes = Buffer.from(salt, 'base64')
  let ui1 = createHMAC(password, Buffer.concat([saltBytes, Buffer.from([0, 0, 0, 1])]))
  let saltedPassword = ui1
  for (let i = iteration - 1; i > 0; i--) {
    ui1 = createHMAC(password, ui1)
    saltedPassword = xorBuffers(saltedPassword, ui1)
  }

  let clientKey = createHMAC(saltedPassword, 'Client Key')
  let storedKey = crypto.createHash('sha256').update(clientKey).digest()
  let messageWithoutProof = `c=biws,r=${nonce}`
  let authMessage = `n=*,r=${socket.clientNonce},r=${nonce},s=${salt},i=${iteration},${messageWithoutProof}`
  let clientSignature = createHMAC(storedKey, authMessage)
  let clientProof = xorBuffers(clientKey, clientSignature).toString('base64')
  let serverKey = createHMAC(saltedPassword, 'Server Key')

  socket.signature = createHMAC(serverKey, authMessage).toString('base64')

  respond(socket, Buffer.from(`p\0\0\0\0${messageWithoutProof},p=${clientProof}`))
}

makeAuthSASLFinal = (socket, data) => {
  if (!getMessage(data, 0, 4).includes('v=' + socket.signature))
    throw new Error('SASL: server signature does not match')
}

const respond = (socket, buffer) => {
  encodeInt32(buffer, 1, buffer.length - 1)
  socket.write(buffer)
}

const createHMAC = (key, msg) =>
  crypto.createHmac('sha256', key).update(msg).digest()

const xorBuffers = (a, b) => {
  const len = Math.max(a.length, b.length)
  let res = Buffer.alloc(len)
  for (let i = 0; i < len; i++)
    res[i] = a[i] ^ b[i]
  return res
}

module.exports = {
  auth: (socket, data, pos) => {
    const authType = decodeInt32(data, pos + 5)
    if (authType === authSuccess)
      return
    if (authType === authCleartextPassword)
      makeAuthCleartext(socket)
    else if (authType === authMD5)
      makeAuthMD5(socket, data)
    else if (authType === authSASLInit)
      makeAuthSASLInit(socket)
    else if (authType === authSASLContinue)
      makeAuthSASLContinue(socket, data)
    else if (authType === authSASLFinal)
      makeAuthSASLFinal(socket, data)
    else if (authType === authKerberosV5)
      return `unsupported auth type: kerberos`
    else if (authType === authSCMCredential)
      return `unsupported auth type: SCM credential`
    else if (authType === authGSS)
      return `unsupported auth type: GSS`
    else if (authType === authSSPI)
      return `unsupported auth type: SSPI`
    else
      return `unknown auth type with code ${authType}`
  }
}
