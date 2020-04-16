import {Socket} from 'net'
import crypto from 'crypto'
import {decodeInt32, encodeInt32, getMessage} from 'lib/buffer'
import {Creds, Task} from 'types'

export enum codes {
  success = 0,
  kerberosV5 = 2,
  cleartextPassword = 3,
  md5 = 5,
  SCMCredential = 6,
  GSS = 7,
  SSPI = 9,
  SASLInit = 10,
  SASLContinue = 11,
  SASLFinal = 12,
}

const makeAuthCleartext = (socket: Socket, creds: Creds) =>
  respond(socket, Buffer.from(`p\0\0\0\0${creds.password}\0`, 'utf8'))

const md5 = (data: string | Buffer) =>
  crypto.createHash('md5').update(data).digest('hex')

const makeAuthMD5 = (socket: Socket, {password, user}: Creds, data: Buffer) => {
  let message
  const creds = md5(password + user)
  const salt = data.slice(9)
  message = 'md5' + md5(Buffer.concat([Buffer.from(creds), salt]))

  respond(socket, Buffer.from(`p\0\0\0\0${message}\0`, 'utf8'))
}

const makeAuthSASLInit = (socket: Socket, request: Task) => {
  const clientNonce = crypto.randomBytes(18).toString('base64')
  request.authData = {clientNonce}
  const message = 'n,,n=*,r=' + clientNonce
  const mechanism = 'SCRAM-SHA-256'
  const buffer = Buffer.from(`p\0\0\0\0${mechanism}\0\0\0\0\0${message}`)
  encodeInt32(buffer, 6 + mechanism.length, message.length)
  respond(socket, buffer)
}

const makeAuthSASLContinue = (socket: Socket, request: Task, creds: Creds, data: Buffer) => {
  if (!request.authData)
    throw new Error('Invalid SASL auth flow')

  const clientNonce = request.authData.clientNonce
  if (!clientNonce)
    throw new Error('Invalid SASL auth flow')

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

  if (nonce && !(nonce as string).startsWith(clientNonce))
    throw new Error('SASL: server nonce does not start with client nonce')

  const password = Buffer.from(creds.password, 'utf8')
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
  let authMessage = `n=*,r=${clientNonce},r=${nonce},s=${salt},i=${iteration},${messageWithoutProof}`
  let clientSignature = createHMAC(storedKey, authMessage)
  let clientProof = xorBuffers(clientKey, clientSignature).toString('base64')
  let serverKey = createHMAC(saltedPassword, 'Server Key')

  request.authData.signature = createHMAC(serverKey, authMessage).toString('base64')

  respond(socket, Buffer.from(`p\0\0\0\0${messageWithoutProof},p=${clientProof}`))
}

const makeAuthSASLFinal = (socket: Socket, request: Task, data: Buffer) => {
  const signature = request.authData?.signature
  if (!signature)
    throw new Error('Invalid SASL auth flow')

  if (!getMessage(data, 0, 4).includes('v=' + signature))
    throw new Error('SASL: server signature does not match')
}

const respond = (socket: Socket, buffer: Buffer) => {
  encodeInt32(buffer, 1, buffer.length - 1)
  socket.write(buffer)
}

const createHMAC = (key: string | Buffer, msg: string | Buffer) =>
  crypto.createHmac('sha256', key).update(msg).digest()

const xorBuffers = (a: Buffer, b: Buffer) => {
  const len = Math.max(a.length, b.length)
  let res = Buffer.alloc(len)
  for (let i = 0; i < len; i++)
    res[i] = a[i] ^ b[i]
  return res
}

export const auth = (socket: Socket, request: Task, creds: Creds, data: Buffer, pos: number) => {
  const authType = decodeInt32(data, pos + 5)
  if (authType === codes.success)
    return
  if (authType === codes.cleartextPassword)
    makeAuthCleartext(socket, creds)
  else if (authType === codes.md5)
    makeAuthMD5(socket, creds, data)
  else if (authType === codes.SASLInit)
    makeAuthSASLInit(socket, request)
  else if (authType === codes.SASLContinue)
    makeAuthSASLContinue(socket, request, creds, data)
  else if (authType === codes.SASLFinal)
    makeAuthSASLFinal(socket, request, data)
  else if (authType === codes.kerberosV5)
    return `unsupported auth type: kerberos`
  else if (authType === codes.SCMCredential)
    return `unsupported auth type: SCM credential`
  else if (authType === codes.GSS)
    return `unsupported auth type: GSS`
  else if (authType === codes.SSPI)
    return `unsupported auth type: SSPI`
  else
    return `unknown auth type with code ${authType}`
}
