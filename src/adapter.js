const {Socket} = require('net')
const {handleMessage} = require('./lib/messageHandler')
const {connect} = require('./lib/connect')
const {query} = require('./lib/query')
const {objectsMode, arraysMode, valueMode, skipMode} = require('./lib/handlers/parseDescription')
const {quote} = require('./lib/quote')
const {setupLog} = require('./lib/setupLog')
const {finishTask} = require('./lib/finishTask')
const {transaction} = require('./lib/transaction')
const {sync} = require('./lib/sync')
const {close} = require('./lib/close')
const decodeTypes = require('./lib/types')

module.exports = class Adapter {
  constructor({
    host = '127.0.0.1',
    port = 5432,
    database = 'postgres',
    user = process.env.USER || 'postgres',
    password = '',
    pool = 10,
    log = true
  } = {}) {
    this.host = host
    this.port = port
    this.database = database
    this.user = user
    this.password = password
    this.pool = pool
    this.sockets = new Array(pool)
    this.task = null
    this.decodeTypes = {...decodeTypes}
    for (let i = 0; i < pool; i++) {
      const socket = new Socket({readable: true, writable: true})
      socket.on('data', handleMessage.bind(null, socket))
      socket.buffer = Buffer.alloc(10000)
      socket.adapter = this
      socket.transaction = this
      socket.finishTask = finishTask.bind(null, socket)
      socket.query = socket.write.bind(socket)
      this.sockets[i] = socket
    }
    this.connected = false
    this.connect = connect.bind(null, this)
    this.close = close.bind(null, this)
    this.adapter = this
    this.transactions = []
    if (log)
      setupLog(this.sockets)
  }

  quote = quote

  performQuery(mode, message) {
    return query(this, mode, message, new Error())
  }

  objects(message) {
    return this.performQuery(objectsMode, message)
  }

  arrays(message) {
    return this.performQuery(arraysMode, message)
  }

  value(message) {
    return this.performQuery(valueMode, message)
  }

  exec(message) {
    return this.performQuery(skipMode, message)
  }

  sync() {
    return sync(this)
  }

  transaction(fn) {
    return transaction(this.adapter, this, fn)
  }
}
