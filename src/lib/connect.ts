import {isIP} from 'net'
import tls from 'tls'
import {Socket, ConnectionSettingType, PgError, ResultMode, Task} from '../types'
import {encodeInt32} from './buffer'
import {handleMessage} from './messageHandler'
import {createTask, next} from './task'
import {Adapter} from '../adapter'

const checkSSLMessage = Buffer.alloc(8)
encodeInt32(checkSSLMessage, 0, 8)
encodeInt32(checkSSLMessage, 4, 80877103)

const SSLCode = 'S'.charCodeAt(0)

const versionBuf = Buffer.alloc(4)
encodeInt32(versionBuf, 0, 196608)

class Connect {
  adapter: Adapter
  socket: Socket
  settings: ConnectionSettingType
  task?: Task

  constructor(adapter: Adapter, socket: Socket, settings: ConnectionSettingType) {
    this.adapter = adapter
    this.socket = socket
    this.settings = settings
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      this.socket.prepared = {}
      this.addTask(resolve, reject)
      this.socketConnect().then(() => this.checkSSL())
    })
  }

  addTask(resolve: (socket: Socket) => any, reject: (err: PgError) => any) {
    const {adapter} = this
    const error: PgError = new Error()
    const task = createTask({
      adapter, error, resolve, reject,
      mode: ResultMode.skip,
      query: 'Startup message',
      decodeTypes: {},
      finish: this.finish
    })
    this.task = task
    this.socket.task = task
  }

  socketConnect() {
    const {port, host} = this.settings
    return new Promise(resolve =>
      this.socket.connect(port, host, resolve)
    )
  }

  checkSSL() {
    this.socket.write(checkSSLMessage)
    const listener = (data: Buffer) => {
      this.sslResponseHandler(data, listener)
    }
    this.socket.on('data', listener)
  }

  sslResponseHandler(data: Buffer, listener: (data: Buffer) => void) {
    const {socket, settings: {host}} = this
    socket.removeListener('data', listener)
    const code = data[0]
    if (code === SSLCode) {
      const options = {
        socket,
        checkServerIdentity: tls.checkServerIdentity,
        rejectUnauthorized: false,
        servername: isIP(host) === 0 ? host : undefined
      }
      this.socket = tls.connect(options, () =>
        this.sendStartupMessage()
      ) as unknown as Socket
      this.socket.prepared = {}
    } else {
      this.sendStartupMessage()
    }
  }

  sendStartupMessage() {
    const {socket} = this
    handleMessage(socket, this.settings)

    const {user, database} = this.settings
    const message = `user\0${user}\0database\0${database}\0\0`
    const len = 8 + message.length
    const buf = Buffer.alloc(len)
    encodeInt32(buf, 0, len)
    versionBuf.copy(buf, 4)
    buf.fill(message, 8)
    socket.write(buf)
  }

  finish(socket: Socket, task: Task) {
    socket.task = undefined

    if (task.failed)
      task.reject(task.error)
    else {
      task.resolve(socket)
      next(task.adapter, socket)
    }
  }
}

export const connect = (adapter: Adapter, socket: Socket, settings: ConnectionSettingType) =>
  new Connect(adapter, socket, settings).connect()
